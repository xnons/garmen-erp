# backend/routers/finishing_shipping.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime

from database import get_db
import models
from schemas.garment_blueprint import (
    PieceRateWageCreate, PieceRateWageUpdate, PieceRateWageResponse,
    ShipmentCreate, ShipmentUpdate, ShipmentResponse
)
from core.security import get_current_user, require_role
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/shipping", tags=["Finishing Borongan, Expedisi & Billing Form WI"])

def format_piece_rate_wage_response(w: models.PieceRateWage, default_op_name: Optional[str] = None) -> PieceRateWageResponse:
    op_name = w.operator.nama if (hasattr(w, "operator") and w.operator) else default_op_name
    return PieceRateWageResponse(
        id=w.id,
        so_id=w.so_id,
        operator_id=w.operator_id,
        operator_name=op_name,
        operation_type=w.operation_type or "STIM",
        work_date=w.work_date,
        qty_completed=w.qty_completed or 0,
        qty_reject=w.qty_reject or 0,
        size_breakdown=w.size_breakdown or {},
        wage_per_piece=w.wage_per_piece or 0.0,
        total_wage=w.total_wage or 0.0,
        notes=w.notes,
        created_at=w.created_at
    )

def format_shipment_response(s: models.Shipment, default_driver_name: Optional[str] = None) -> ShipmentResponse:
    drv_name = s.driver.nama if (hasattr(s, "driver") and s.driver) else (s.driver_name or default_driver_name)
    return ShipmentResponse(
        id=s.id,
        so_id=s.so_id,
        shipment_date=s.shipment_date,
        surat_jalan_no=s.surat_jalan_no or "-",
        driver_id=s.driver_id,
        driver_name=drv_name,
        vehicle_plate_no=s.vehicle_plate_no,
        carton_box_count=s.carton_box_count or 0,
        destination_address=s.destination_address,
        total_qty_shipped=s.total_qty_shipped or 0,
        size_breakdown_shipped=s.size_breakdown_shipped or {},
        unit_price=s.unit_price or 0.0,
        total_invoice_amount=s.total_invoice_amount or 0.0,
        invoice_number=s.invoice_number,
        is_invoiced=s.is_invoiced or False,
        remarks=s.remarks,
        created_at=s.created_at
    )

# ---------------------------------------------------------------------------
# 1. PIECE-RATE WAGES (UPAH SATUAN FINISHING: STEAM JOHAN, KANCING, DLL)
# ---------------------------------------------------------------------------
@router.get("/wages", response_model=List[PieceRateWageResponse])
def get_piece_rate_wages(
    so_id: Optional[str] = None,
    operation_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.PieceRateWage).options(
        joinedload(models.PieceRateWage.operator)
    )
    if so_id:
        query = query.filter(models.PieceRateWage.so_id == so_id)
    if operation_type:
        query = query.filter(models.PieceRateWage.operation_type == operation_type.upper())
    wages = query.order_by(models.PieceRateWage.work_date.desc()).all()

    return [format_piece_rate_wage_response(w, current_user.nama) for w in wages]

@router.post("/wages", response_model=PieceRateWageResponse, status_code=status.HTTP_201_CREATED)
def create_piece_rate_wage(
    payload: PieceRateWageCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == payload.so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    assigned_operator_id = payload.operator_id or current_user.id_karyawan
    operator_obj = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == assigned_operator_id).first()
    operator_name = operator_obj.nama if operator_obj else current_user.nama

    total_wage = round(payload.qty_completed * payload.wage_per_piece, 2)

    wage = models.PieceRateWage(
        so_id=payload.so_id,
        operator_id=assigned_operator_id,
        operation_type=payload.operation_type.upper(),
        work_date=payload.work_date,
        qty_completed=payload.qty_completed,
        qty_reject=payload.qty_reject or 0,
        size_breakdown=payload.size_breakdown or {},
        wage_per_piece=payload.wage_per_piece,
        total_wage=total_wage,
        notes=payload.notes
    )
    db.add(wage)
    db.commit()
    db.refresh(wage)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_FINISHING_WAGE",
        target_id=wage.id,
        catatan=f"Entri upah {payload.operation_type} ({payload.qty_completed} pcs @ Rp {payload.wage_per_piece}) untuk {operator_name} (Total: Rp {total_wage:,.0f})."
    )

    return format_piece_rate_wage_response(wage, operator_name)

@router.put("/wages/{wage_id}", response_model=PieceRateWageResponse)
def update_piece_rate_wage(
    wage_id: str,
    payload: PieceRateWageUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PRODUKSI", "FINANCE", "ADMIN", "OWNER", "DEVELOPER"]))
):
    wage = db.query(models.PieceRateWage).options(
        joinedload(models.PieceRateWage.operator)
    ).filter(models.PieceRateWage.id == wage_id).first()
    if not wage:
        raise HTTPException(status_code=404, detail="Data upah borongan tidak ditemukan.")

    old_total = wage.total_wage
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            if k == "operation_type":
                setattr(wage, k, str(v).upper())
            else:
                setattr(wage, k, v)

    # Rekalkulasi total upah
    wage.total_wage = round((wage.qty_completed or 0) * (wage.wage_per_piece or 0.0), 2)

    db.commit()
    db.refresh(wage)

    op_name = wage.operator.nama if wage.operator else current_user.nama
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_FINISHING_WAGE",
        target_id=wage.id,
        catatan=f"Upah borongan #{wage_id} ({wage.operation_type} - {op_name}) dikoreksi oleh {current_user.nama} (Rp {old_total:,.0f} -> Rp {wage.total_wage:,.0f})."
    )

    return format_piece_rate_wage_response(wage, op_name)

@router.delete("/wages/{wage_id}")
def delete_piece_rate_wage(
    wage_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    wage = db.query(models.PieceRateWage).filter(models.PieceRateWage.id == wage_id).first()
    if not wage:
        raise HTTPException(status_code=404, detail="Data upah tidak ditemukan.")
    
    w_op = wage.operation_type
    w_tot = wage.total_wage
    db.delete(wage)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_FINISHING_WAGE",
        target_id=wage_id,
        catatan=f"Entri upah {w_op} #{wage_id} (Rp {w_tot:,.0f}) dihapus oleh {current_user.nama}."
    )
    return {"message": "Data upah borongan berhasil dihapus."}


# ---------------------------------------------------------------------------
# 2. SHIPMENTS & SURAT JALAN PENGIRIMAN (SJP)
# ---------------------------------------------------------------------------
@router.get("/shipments", response_model=List[ShipmentResponse])
def get_shipments(
    so_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.Shipment).options(
        joinedload(models.Shipment.driver)
    )
    if so_id:
        query = query.filter(models.Shipment.so_id == so_id)
    shipments = query.order_by(models.Shipment.shipment_date.desc()).all()

    return [format_shipment_response(s, current_user.nama) for s in shipments]

@router.post("/shipments", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(
    payload: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == payload.so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    existing_sjp = db.query(models.Shipment).filter(models.Shipment.surat_jalan_no == payload.surat_jalan_no).first()
    if existing_sjp:
        raise HTTPException(status_code=400, detail=f"Nomor SJP '{payload.surat_jalan_no}' sudah terdaftar!")

    total_invoice = round(payload.total_qty_shipped * payload.unit_price, 2)

    shipment = models.Shipment(
        so_id=payload.so_id,
        shipment_date=payload.shipment_date,
        surat_jalan_no=payload.surat_jalan_no.upper(),
        driver_id=payload.driver_id or current_user.id_karyawan,
        driver_name=payload.driver_name or (current_user.nama if not payload.driver_id else None),
        vehicle_plate_no=payload.vehicle_plate_no,
        carton_box_count=payload.carton_box_count or 0,
        destination_address=payload.destination_address,
        total_qty_shipped=payload.total_qty_shipped,
        size_breakdown_shipped=payload.size_breakdown_shipped or {},
        unit_price=payload.unit_price,
        total_invoice_amount=total_invoice,
        invoice_number=payload.invoice_number,
        is_invoiced=bool(payload.invoice_number),
        remarks=payload.remarks
    )
    db.add(shipment)
    
    # Update SO status
    so.status = "SHIPPED"

    db.commit()
    db.refresh(shipment)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_SHIPMENT_SJP",
        target_id=shipment.id,
        catatan=f"Pengiriman SJP '{shipment.surat_jalan_no}' sejumlah {payload.total_qty_shipped} pcs untuk SO '{so.so_number}'."
    )

    return format_shipment_response(shipment, current_user.nama)

@router.put("/shipments/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(
    shipment_id: str,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    shipment = db.query(models.Shipment).options(
        joinedload(models.Shipment.driver)
    ).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Data pengiriman / SJP tidak ditemukan.")

    old_qty = shipment.total_qty_shipped
    old_inv = shipment.total_invoice_amount

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            if k == "surat_jalan_no":
                setattr(shipment, k, str(v).upper())
            else:
                setattr(shipment, k, v)

    # Rekalkulasi Total Invoice
    shipment.total_invoice_amount = round((shipment.total_qty_shipped or 0) * (shipment.unit_price or 0.0), 2)
    shipment.is_invoiced = bool(shipment.invoice_number)

    db.commit()
    db.refresh(shipment)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_SHIPMENT_SJP",
        target_id=shipment.id,
        catatan=f"SJP '{shipment.surat_jalan_no}' dikoreksi oleh {current_user.nama} (Qty: {old_qty}->{shipment.total_qty_shipped} pcs, Tagihan: Rp {old_inv:,.0f} -> Rp {shipment.total_invoice_amount:,.0f})."
    )

    resp = ShipmentResponse.from_orm(shipment)
    resp.driver_name = getattr(shipment.driver, "nama", current_user.nama)
    return resp

@router.delete("/shipments/{shipment_id}")
def delete_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Data pengiriman tidak ditemukan.")

    sjp = shipment.surat_jalan_no
    db.delete(shipment)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_SHIPMENT_SJP",
        target_id=shipment_id,
        catatan=f"SJP '{sjp}' (#{shipment_id}) dihapus oleh {current_user.nama}."
    )
    return {"message": f"Data pengiriman SJP '{sjp}' berhasil dihapus."}


# ---------------------------------------------------------------------------
# 3. FORM WI (CMT BILLING & SETTLEMENT RECAP)
# ---------------------------------------------------------------------------
@router.get("/form-wi/{so_id}")
def get_form_wi_settlement(
    so_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).options(
        joinedload(models.SalesOrder.buyer)
    ).filter(models.SalesOrder.id == so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    # 1. Total Terkirim
    shipments = db.query(models.Shipment).filter(models.Shipment.so_id == so.id).all()
    total_qty_shipped = sum(s.total_qty_shipped for s in shipments)
    total_gross_cmt = round(total_qty_shipped * (so.unit_price or 0.0), 2)

    # 2. Total Pemakaian Bahan (Potongan Bahan jika CMT)
    allocations = db.query(models.MaterialAllocation).options(joinedload(models.MaterialAllocation.item)).filter(models.MaterialAllocation.so_id == so.id).all()
    total_material_cost = sum(a.qty_issued * (a.item.unit_price or 0.0) for a in allocations if a.item)

    # 3. Total Upah Finishing
    wages = db.query(models.PieceRateWage).filter(models.PieceRateWage.so_id == so.id).all()
    total_finishing_wage = sum(w.total_wage for w in wages)

    # 4. Net Settlement
    net_receivable = max(0.0, total_gross_cmt - total_material_cost)

    return {
        "so_id": so.id,
        "so_number": so.so_number,
        "buyer_name": so.buyer.name if so.buyer else "UMUM",
        "style_name": so.style_name,
        "order_qty": so.order_qty,
        "total_shipped": total_qty_shipped,
        "unit_price_cmt": so.unit_price,
        "total_gross_cmt": total_gross_cmt,
        "total_material_deduction": total_material_cost,
        "total_finishing_wage": total_finishing_wage,
        "net_billing_amount": net_receivable,
        "shipment_list": [
            {
                "sjp_number": s.surat_jalan_no,
                "date": s.shipment_date,
                "qty": s.total_qty_shipped,
                "invoice": s.invoice_number
            }
            for s in shipments
        ]
    }
