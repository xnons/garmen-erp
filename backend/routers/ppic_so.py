# backend/routers/ppic_so.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
import models
from schemas.garment_blueprint import (
    PartnerCreate, PartnerUpdate, PartnerResponse,
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse
)
from core.security import get_current_user, require_role
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/ppic", tags=["PPIC & Sales Order (SO)"])

# ---------------------------------------------------------------------------
# 1. PARTNERS MANAGEMENT (BUYERS & SUBCON VENDORS)
# ---------------------------------------------------------------------------
@router.get("/partners", response_model=List[PartnerResponse])
def get_all_partners(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.Partner)
    if category:
        query = query.filter(models.Partner.category == category.upper())
    return query.order_by(models.Partner.name.asc()).all()

@router.post("/partners", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
def create_partner(
    payload: PartnerCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PPIC", "ADMIN", "OWNER", "DEVELOPER"]))
):
    partner = models.Partner(
        code=payload.code or f"PTR-{int(datetime.utcnow().timestamp()) % 10000}",
        name=payload.name.upper(),
        category=payload.category.upper(),
        address=payload.address,
        phone=payload.phone
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_PARTNER",
        target_id=partner.id,
        catatan=f"Master Rekanan '{partner.name}' ({partner.category}) didaftarkan oleh {current_user.nama}."
    )
    return partner

@router.put("/partners/{partner_id}", response_model=PartnerResponse)
def update_partner(
    partner_id: str,
    payload: PartnerUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PPIC", "ADMIN", "OWNER", "DEVELOPER"]))
):
    partner = db.query(models.Partner).filter(models.Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner / Rekanan tidak ditemukan.")

    old_name = partner.name
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            if k in ["name", "category"]:
                setattr(partner, k, str(v).upper())
            else:
                setattr(partner, k, v)

    db.commit()
    db.refresh(partner)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_PARTNER",
        target_id=partner.id,
        catatan=f"Data Rekanan '{old_name}' diperbarui menjadi '{partner.name}' oleh {current_user.nama}."
    )
    return partner

@router.delete("/partners/{partner_id}")
def delete_partner(
    partner_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    partner = db.query(models.Partner).filter(models.Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner tidak ditemukan.")
    
    p_name = partner.name
    db.delete(partner)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_PARTNER",
        target_id=partner_id,
        catatan=f"Rekanan '{p_name}' dihapus oleh {current_user.nama}."
    )
    return {"message": f"Partner '{p_name}' berhasil dihapus."}


# ---------------------------------------------------------------------------
# 2. SALES ORDER (SO) MANAGEMENT
# ---------------------------------------------------------------------------
@router.get("/orders", response_model=List[SalesOrderResponse])
def get_all_sales_orders(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.SalesOrder).options(joinedload(models.SalesOrder.buyer))
    if status_filter:
        query = query.filter(models.SalesOrder.status == status_filter.upper())
    orders = query.order_by(models.SalesOrder.created_at.desc()).all()
    
    result = []
    for so in orders:
        item_dict = SalesOrderResponse.from_orm(so)
        if so.buyer:
            item_dict.buyer_name = so.buyer.name
        result.append(item_dict)
    return result

@router.post("/orders", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PPIC", "ADMIN", "OWNER", "DEVELOPER"]))
):
    existing = db.query(models.SalesOrder).filter(models.SalesOrder.so_number == payload.so_number).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Sales Order dengan nomor '{payload.so_number}' sudah terdaftar!"
        )

    # Validasi Size Breakdown
    calculated_qty = payload.order_qty
    if payload.size_breakdown_target:
        matrix_sum = sum(payload.size_breakdown_target.values())
        if matrix_sum > 0:
            calculated_qty = matrix_sum

    new_so = models.SalesOrder(
        so_number=payload.so_number.upper(),
        buyer_id=payload.buyer_id,
        style_name=payload.style_name.upper(),
        item_category=payload.item_category or "LONG JEANS",
        color=payload.color,
        order_qty=calculated_qty,
        unit_price=payload.unit_price or 0.0,
        size_breakdown_target=payload.size_breakdown_target or {},
        bom_accessories=payload.bom_accessories or [],
        status="REGISTERED",
        order_date=payload.order_date or datetime.utcnow().date(),
        deadline=payload.deadline
    )
    db.add(new_so)
    db.commit()
    db.refresh(new_so)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_SALES_ORDER",
        target_id=new_so.so_number,
        catatan=f"Sales Order '{new_so.so_number}' ({new_so.style_name} - {new_so.order_qty} pcs) dibuat oleh {current_user.nama}."
    )

    resp = SalesOrderResponse.from_orm(new_so)
    if new_so.buyer:
        resp.buyer_name = new_so.buyer.name
    return resp

@router.get("/orders/{so_id}", response_model=SalesOrderResponse)
def get_sales_order_detail(
    so_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).options(joinedload(models.SalesOrder.buyer)).filter(models.SalesOrder.id == so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")
    
    resp = SalesOrderResponse.from_orm(so)
    if so.buyer:
        resp.buyer_name = so.buyer.name
    return resp

@router.put("/orders/{so_id}", response_model=SalesOrderResponse)
def update_sales_order(
    so_id: str,
    payload: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PPIC", "ADMIN", "OWNER", "DEVELOPER"]))
):
    so = db.query(models.SalesOrder).options(joinedload(models.SalesOrder.buyer)).filter(models.SalesOrder.id == so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    old_qty = so.order_qty
    old_style = so.style_name

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            if k in ["style_name", "item_category"]:
                setattr(so, k, str(v).upper())
            else:
                setattr(so, k, v)

    if payload.size_breakdown_target:
        matrix_sum = sum(payload.size_breakdown_target.values())
        if matrix_sum > 0:
            so.order_qty = matrix_sum

    db.commit()
    db.refresh(so)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_SALES_ORDER",
        target_id=so.so_number,
        catatan=f"Sales Order '{so.so_number}' dikoreksi oleh {current_user.nama} (Style: {old_style}->{so.style_name}, Qty: {old_qty}->{so.order_qty} pcs, DL: {so.deadline})."
    )
    
    resp = SalesOrderResponse.from_orm(so)
    if so.buyer:
        resp.buyer_name = so.buyer.name
    return resp

@router.delete("/orders/{so_id}")
def delete_sales_order(
    so_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")
    
    so_num = so.so_number
    db.delete(so)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_SALES_ORDER",
        target_id=so_num,
        catatan=f"Sales Order '{so_num}' dihapus oleh {current_user.nama}."
    )
    return {"message": f"Sales Order '{so_num}' berhasil dihapus."}
