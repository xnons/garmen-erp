# backend/routers/warehouse_fabric.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
import models
from schemas.garment_blueprint import (
    InventoryItemCreate, InventoryItemResponse,
    MaterialReceiptCreate, MaterialReceiptUpdate, MaterialReceiptResponse,
    FabricInspectionCreate, FabricInspectionUpdate, FabricInspectionResponse,
    MaterialAllocationCreate, MaterialAllocationResponse
)
from core.security import get_current_user, require_role
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
        current_stock=payload.current_stock or 0.0,
        color_shade_lot=payload.color_shade_lot,
        width_inch=payload.width_inch or 58.0,
        gramasi_gsm=payload.gramasi_gsm or 0.0,
        min_stock_alert=payload.min_stock_alert or 50.0,
        rack_location=payload.rack_location or "GUDANG_UTAMA"
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_INVENTORY_ITEM",
        target_id=item.item_code,
        catatan=f"Master item kain '{item.item_code}' ({item.description}) didaftarkan oleh {current_user.nama}."
    )
    return item

@router.put("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: str,
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["GUDANG", "ADMIN", "OWNER", "DEVELOPER"]))
):
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item inventaris tidak ditemukan.")

    old_stock = item.current_stock
    item.item_code = payload.item_code.upper()
    item.description = payload.description
    item.item_type = payload.item_type.upper()
    item.unit = payload.unit or item.unit
    item.unit_price = payload.unit_price or 0.0
    item.current_stock = payload.current_stock or 0.0
    item.color_shade_lot = payload.color_shade_lot
    item.width_inch = payload.width_inch or 58.0
    item.gramasi_gsm = payload.gramasi_gsm or 0.0
    item.min_stock_alert = payload.min_stock_alert or 50.0
    item.rack_location = payload.rack_location or "GUDANG_UTAMA"

    db.commit()
    db.refresh(item)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_INVENTORY_ITEM",
        target_id=item.item_code,
        catatan=f"Item '{item.item_code}' diperbarui oleh {current_user.nama} (Stok: {old_stock} -> {item.current_stock} {item.unit})."
    )
    return item

@router.delete("/items/{item_id}")
def delete_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item inventaris tidak ditemukan.")
    
    code = item.item_code
    db.delete(item)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_INVENTORY_ITEM",
        target_id=code,
        catatan=f"Master item kain '{code}' dihapus oleh {current_user.nama}."
    )
    return {"message": f"Item '{code}' berhasil dihapus."}


def format_material_receipt_response(r: models.MaterialReceipt) -> MaterialReceiptResponse:
    item_desc = r.item.description if (hasattr(r, "item") and r.item) else None
    supp_name = r.supplier.name if (hasattr(r, "supplier") and r.supplier) else None
    return MaterialReceiptResponse(
        id=str(r.id),
        item_id=r.item_id,
        supplier_id=r.supplier_id,
        receipt_date=r.receipt_date,
        roll_number=r.roll_number,
        qty_received=r.qty_received or 0.0,
        unit=r.unit or "YARD",
        contract_type=r.contract_type or "FOB",
        inspection_status=r.inspection_status or "PENDING",
        item_description=item_desc,
        supplier_name=supp_name,
        created_at=r.created_at
    )


def format_inspection_response(fi: models.FabricInspection, current_user_name: Optional[str] = None) -> FabricInspectionResponse:
    insp_name = fi.inspector.nama if (hasattr(fi, "inspector") and fi.inspector) else current_user_name
    return FabricInspectionResponse(
        id=str(fi.id),
        receipt_id=fi.receipt_id,
        inspector_id=fi.inspector_id,
        inspector_name=insp_name,
        inspection_date=fi.inspection_date,
        lot_number=fi.lot_number,
        length_before=fi.length_before or 0.0,
        length_after=fi.length_after or 0.0,
        width_inch=fi.width_inch or 0.0,
        total_defect_points=fi.total_defect_points or 0,
        summary_point=fi.summary_point or 0.0,
        grade=fi.grade or "GRADE_A",
        defect_remarks=fi.defect_remarks,
        created_at=fi.created_at,
    )


def format_allocation_response(a: models.MaterialAllocation) -> MaterialAllocationResponse:
    so_num = a.sales_order.so_number if (hasattr(a, "sales_order") and a.sales_order) else None
    item_desc = a.item.description if (hasattr(a, "item") and a.item) else None
    return MaterialAllocationResponse(
        id=str(a.id),
        so_id=a.so_id,
        item_id=a.item_id,
        dispatch_date=a.dispatch_date,
        qty_issued=a.qty_issued or 0.0,
        surat_jalan_no=a.surat_jalan_no,
        so_number=so_num,
        item_description=item_desc,
        created_at=a.created_at,
    )

# ---------------------------------------------------------------------------
# 2. GOODS RECEIPT NOTE (BARANG MASUK)
# ---------------------------------------------------------------------------
@router.get("/receipts", response_model=List[MaterialReceiptResponse])
def get_material_receipts(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    try:
        receipts = db.query(models.MaterialReceipt).options(
            joinedload(models.MaterialReceipt.item),
            joinedload(models.MaterialReceipt.supplier)
        ).order_by(models.MaterialReceipt.receipt_date.desc()).all()

        return [format_material_receipt_response(r) for r in receipts]
    except Exception as e:
        print(f"⚠️ Error get_material_receipts: {e}")
        return []

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

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_RECEIPT",
        target_id=receipt.id,
        catatan=f"Penerimaan roll kain {payload.roll_number or '-'} ({payload.qty_received} {receipt.unit}) dicatat oleh {current_user.nama}."
    )

    return format_material_receipt_response(receipt)

@router.put("/receipts/{receipt_id}", response_model=MaterialReceiptResponse)
def update_material_receipt(
    receipt_id: str,
    payload: MaterialReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["GUDANG", "ADMIN", "OWNER", "DEVELOPER"]))
):
    receipt = db.query(models.MaterialReceipt).options(
        joinedload(models.MaterialReceipt.item),
        joinedload(models.MaterialReceipt.supplier)
    ).filter(models.MaterialReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Log penerimaan kain tidak ditemukan.")

    item = receipt.item
    old_qty = receipt.qty_received

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(receipt, k, v)

    # Sinkronisasi penyesuaian selisih stok jika kuantitas diubah
    if payload.qty_received is not None and item:
        diff = payload.qty_received - old_qty
        item.current_stock = max(0.0, (item.current_stock or 0.0) + diff)

    db.commit()
    db.refresh(receipt)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_RECEIPT",
        target_id=receipt.id,
        catatan=f"Penerimaan roll {receipt.roll_number or receipt_id} dikoreksi oleh {current_user.nama} (Qty: {old_qty} -> {receipt.qty_received} {receipt.unit})."
    )

    return format_material_receipt_response(receipt)

@router.delete("/receipts/{receipt_id}")
def delete_material_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    receipt = db.query(models.MaterialReceipt).filter(models.MaterialReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Log penerimaan kain tidak ditemukan.")
    
    # Revert stok
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == receipt.item_id).first()
    if item:
        item.current_stock = max(0.0, (item.current_stock or 0.0) - (receipt.qty_received or 0.0))

    roll_num = receipt.roll_number or receipt_id
    db.delete(receipt)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_RECEIPT",
        target_id=receipt_id,
        catatan=f"Penerimaan roll {roll_num} ({receipt.qty_received} {receipt.unit}) dibatalkan/dihapus oleh {current_user.nama}."
    )
    return {"message": f"Penerimaan roll '{roll_num}' berhasil dihapus."}


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

    return [format_inspection_response(fi, current_user.nama) for fi in inspections]

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

    return format_inspection_response(inspection, current_user.nama)

@router.put("/inspections/{inspection_id}", response_model=FabricInspectionResponse)
def update_fabric_inspection(
    inspection_id: str,
    payload: FabricInspectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["GUDANG", "ADMIN", "OWNER", "DEVELOPER"]))
):
    inspection = db.query(models.FabricInspection).options(
        joinedload(models.FabricInspection.inspector),
        joinedload(models.FabricInspection.receipt)
    ).filter(models.FabricInspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Data uji QC kain tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(inspection, k, v)

    # Rekalkulasi score
    if inspection.width_inch > 0 and inspection.length_after > 0:
        summary_pt = (inspection.total_defect_points * 3600.0) / (inspection.width_inch * inspection.length_after)
        inspection.summary_point = round(summary_pt, 2)
        if inspection.summary_point <= 20.0:
            inspection.grade = "GRADE_A"
        elif inspection.summary_point <= 30.0:
            inspection.grade = "GRADE_B"
        else:
            inspection.grade = "GRADE_C"

    db.commit()
    db.refresh(inspection)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_FABRIC_INSPECTION",
        target_id=inspection.id,
        catatan=f"Koreksi hasil uji kain roll #{inspection.receipt_id} oleh {current_user.nama} (Grade: {inspection.grade}, Score: {inspection.summary_point})."
    )

    return format_inspection_response(inspection, current_user.nama)


# ---------------------------------------------------------------------------
# 4. MATERIAL ALLOCATION (PENYERAHAN KAIN KE CUTTING)
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

    return [format_allocation_response(a) for a in allocations]

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

    return format_allocation_response(allocation)

@router.delete("/allocations/{allocation_id}")
def delete_material_allocation(
    allocation_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    alloc = db.query(models.MaterialAllocation).filter(models.MaterialAllocation.id == allocation_id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Alokasi kain tidak ditemukan.")

    # Revert stok ke item
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == alloc.item_id).first()
    if item:
        item.current_stock = (item.current_stock or 0.0) + (alloc.qty_issued or 0.0)

    db.delete(alloc)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_ALLOCATION",
        target_id=allocation_id,
        catatan=f"Alokasi kain SJ {alloc.surat_jalan_no} ({alloc.qty_issued} yard) dibatalkan dan stok dikembalikan oleh {current_user.nama}."
    )
    return {"message": "Alokasi kain berhasil dibatalkan dan stok dikembalikan ke gudang."}
