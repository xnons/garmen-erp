# backend/routers/warehouse_fabric.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
import models
from schemas.garment_blueprint import (
    InventoryItemCreate, InventoryItemResponse,
    MaterialReceiptCreate, MaterialReceiptResponse,
    FabricInspectionCreate, FabricInspectionResponse,
    MaterialAllocationCreate, MaterialAllocationResponse
)
from core.security import get_current_user
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/warehouse", tags=["Gudang Bahan Baku & QC 4-Point"])

# ---------------------------------------------------------------------------
# 1. INVENTORY ITEMS (MASTER BAHAN BAKU & SALDO LIVE)
# ---------------------------------------------------------------------------
@router.get("/items", response_model=List[InventoryItemResponse])
def get_inventory_items(
    item_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.InventoryItem)
    if item_type:
        query = query.filter(models.InventoryItem.item_type == item_type.upper())
    return query.order_by(models.InventoryItem.item_code.asc()).all()

@router.post("/items", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    existing = db.query(models.InventoryItem).filter(models.InventoryItem.item_code == payload.item_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Item code '{payload.item_code}' sudah terdaftar!")

    item = models.InventoryItem(
        item_code=payload.item_code.upper(),
        description=payload.description,
        item_type=payload.item_type.upper(),
        unit=payload.unit or "YARD",
        unit_price=payload.unit_price or 0.0,
        current_stock=payload.current_stock or 0.0
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# 2. GOODS RECEIPT NOTE (BARANG MASUK)
# ---------------------------------------------------------------------------
@router.get("/receipts", response_model=List[MaterialReceiptResponse])
def get_material_receipts(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    receipts = db.query(models.MaterialReceipt).options(
        joinedload(models.MaterialReceipt.item),
        joinedload(models.MaterialReceipt.supplier)
    ).order_by(models.MaterialReceipt.receipt_date.desc()).all()

    result = []
    for r in receipts:
        r_dict = MaterialReceiptResponse.from_orm(r)
        if r.item:
            r_dict.item_description = r.item.description
        if r.supplier:
            r_dict.supplier_name = r.supplier.name
        result.append(r_dict)
    return result

@router.post("/receipts", response_model=MaterialReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_material_receipt(
    payload: MaterialReceiptCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item inventaris tidak ditemukan.")

    receipt = models.MaterialReceipt(
        item_id=payload.item_id,
        supplier_id=payload.supplier_id,
        receipt_date=payload.receipt_date,
        roll_number=payload.roll_number,
        qty_received=payload.qty_received,
        unit=payload.unit or "YARD",
        contract_type=payload.contract_type or "FOB",
        inspection_status="PENDING"
    )
    db.add(receipt)
    
    # Update stok live
    item.current_stock = (item.current_stock or 0.0) + payload.qty_received
    db.commit()
    db.refresh(receipt)

    resp = MaterialReceiptResponse.from_orm(receipt)
    if receipt.item:
        resp.item_description = receipt.item.description
    return resp


# ---------------------------------------------------------------------------
# 3. FABRIC INSPECTION (4-POINT ASTM SYSTEM & SAFETY GATE)
# ---------------------------------------------------------------------------
@router.get("/inspections", response_model=List[FabricInspectionResponse])
def get_fabric_inspections(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    inspections = db.query(models.FabricInspection).options(
        joinedload(models.FabricInspection.inspector)
    ).order_by(models.FabricInspection.inspection_date.desc()).all()

    result = []
    for fi in inspections:
        fi_dict = FabricInspectionResponse.from_orm(fi)
        if fi.inspector:
            fi_dict.inspector_name = fi.inspector.nama
        result.append(fi_dict)
    return result

@router.post("/inspections", response_model=FabricInspectionResponse, status_code=status.HTTP_201_CREATED)
def create_fabric_inspection(
    payload: FabricInspectionCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    receipt = db.query(models.MaterialReceipt).filter(models.MaterialReceipt.id == payload.receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Log barang masuk (Receipt) tidak ditemukan.")

    if payload.width_inch <= 0 or payload.length_after <= 0:
        raise HTTPException(status_code=400, detail="Lebar kain (inch) dan panjang setelah ukur (yard) harus lebih besar dari 0.")

    # 🟢 RUMUS 4-POINT ASTM:
    # Summary Point = (Total Defect Points * 3600) / (Width in inches * Length in yards)
    summary_pt = (payload.total_defect_points * 3600.0) / (payload.width_inch * payload.length_after)
    summary_pt = round(summary_pt, 2)

    # 🟢 DETERMINASI GRADE MUTU:
    # Grade A: 0 - 20 points
    # Grade B: 21 - 30 points
    # Grade C: > 30 points (DITOLAK)
    if summary_pt <= 20.0:
        grade = "GRADE_A"
        receipt_status = "PASSED"
    elif summary_pt <= 30.0:
        grade = "GRADE_B"
        receipt_status = "PASSED"
    else:
        grade = "GRADE_C"
        receipt_status = "REJECTED"

    inspection = models.FabricInspection(
        receipt_id=payload.receipt_id,
        inspector_id=current_user.id_karyawan,
        inspection_date=payload.inspection_date,
        lot_number=payload.lot_number,
        length_before=payload.length_before,
        length_after=payload.length_after,
        width_inch=payload.width_inch,
        total_defect_points=payload.total_defect_points,
        summary_point=summary_pt,
        grade=grade,
        defect_remarks=payload.defect_remarks
    )
    db.add(inspection)

    # Update status receipt
    receipt.inspection_status = receipt_status
    db.commit()
    db.refresh(inspection)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="FABRIC_INSPECTION",
        target_id=inspection.id,
        catatan=f"Uji kain roll {receipt.roll_number or receipt.id} menghasilkan Score: {summary_pt} ({grade} - {receipt_status})."
    )

    resp = FabricInspectionResponse.from_orm(inspection)
    resp.inspector_name = current_user.nama
    return resp


# ---------------------------------------------------------------------------
# 4. MATERIAL ALLOCATION (PENYERAHAN KAIN KE CUTTING - SHEET25)
# ---------------------------------------------------------------------------
@router.get("/allocations", response_model=List[MaterialAllocationResponse])
def get_material_allocations(
    so_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.MaterialAllocation).options(
        joinedload(models.MaterialAllocation.sales_order),
        joinedload(models.MaterialAllocation.item)
    )
    if so_id:
        query = query.filter(models.MaterialAllocation.so_id == so_id)
    allocations = query.order_by(models.MaterialAllocation.dispatch_date.desc()).all()

    result = []
    for a in allocations:
        a_dict = MaterialAllocationResponse.from_orm(a)
        if a.sales_order:
            a_dict.so_number = a.sales_order.so_number
        if a.item:
            a_dict.item_description = a.item.description
        result.append(a_dict)
    return result

@router.post("/allocations", response_model=MaterialAllocationResponse, status_code=status.HTTP_201_CREATED)
def create_material_allocation(
    payload: MaterialAllocationCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == payload.so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item inventaris kain tidak ditemukan.")

    if (item.current_stock or 0.0) < payload.qty_issued:
        raise HTTPException(
            status_code=400,
            detail=f"Stok kain tidak mencukupi! Tersedia: {item.current_stock} {item.unit}, diminta: {payload.qty_issued} {item.unit}."
        )

    # 🔒 SAFETY GATE: Pastikan roll kain yang dialokasikan bukan berstatus REJECTED (Grade C)
    sj_code = payload.surat_jalan_no or f"CJM-{datetime.utcnow().strftime('%y%m')}.{int(datetime.utcnow().timestamp()) % 1000}"

    allocation = models.MaterialAllocation(
        so_id=payload.so_id,
        item_id=payload.item_id,
        dispatch_date=payload.dispatch_date,
        qty_issued=payload.qty_issued,
        surat_jalan_no=sj_code
    )
    db.add(allocation)

    # Kurangi stok gudang
    item.current_stock = max(0.0, float(item.current_stock or 0.0) - float(payload.qty_issued))
    
    # Update SO status to CUTTING if registered
    if so.status == "REGISTERED":
        so.status = "CUTTING"

    db.commit()
    db.refresh(allocation)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="MATERIAL_ALLOCATION",
        target_id=allocation.id,
        catatan=f"Pengeluaran kain {payload.qty_issued} {item.unit} ({item.description}) untuk SO '{so.so_number}' via SJ '{sj_code}'."
    )

    resp = MaterialAllocationResponse.from_orm(allocation)
    resp.so_number = so.so_number
    resp.item_description = item.description
    return resp
