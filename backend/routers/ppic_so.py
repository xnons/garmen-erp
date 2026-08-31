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


def parse_json_safely(val, default):
    if val is None:
        return default
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, str):
        try:
            import json
            return json.loads(val)
        except Exception:
            return default
    return default

def format_sales_order_response(so: models.SalesOrder) -> SalesOrderResponse:
    b_name = so.buyer.name if (hasattr(so, "buyer") and so.buyer) else getattr(so, "buyer_name", None)
    return SalesOrderResponse(
        id=str(so.id),
        so_number=so.so_number or "",
        buyer_id=so.buyer_id,
        buyer_name=b_name,
        buyer_po_number=so.buyer_po_number,
        customer_pic_name=so.customer_pic_name,
        customer_pic_phone=so.customer_pic_phone,
        customer_email=so.customer_email,
        delivery_address=so.delivery_address,
        style_name=so.style_name or "-",
        item_category=so.item_category or "GARMENT",
        color=so.color or "-",
        fabric_type=so.fabric_type,
        target_shrinkage_pct=so.target_shrinkage_pct or 0.0,
        special_instructions=so.special_instructions,
        contract_type=so.contract_type or "CMT",
        order_qty=so.order_qty or 0,
        unit_price=so.unit_price or 0.0,
        total_order_value=so.total_order_value or 0.0,
        dp_amount=so.dp_amount or 0.0,
        payment_terms=so.payment_terms or "NET_30",
        tax_ppn_pct=so.tax_ppn_pct or 0.0,
        discount_amount=so.discount_amount or 0.0,
        size_breakdown_target=parse_json_safely(so.size_breakdown_target, {}),
        bom_accessories=parse_json_safely(so.bom_accessories, []),
        status=so.status or "REGISTERED",
        order_date=so.order_date,
        deadline=so.deadline,
        created_at=so.created_at
    )

# ---------------------------------------------------------------------------
# 2. SALES ORDER (SO) MANAGEMENT
# ---------------------------------------------------------------------------
@router.get("/orders", response_model=List[SalesOrderResponse])
def get_all_sales_orders(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    try:
        query = db.query(models.SalesOrder).options(joinedload(models.SalesOrder.buyer))
        if status_filter:
            query = query.filter(models.SalesOrder.status == status_filter.upper())
        orders = query.order_by(models.SalesOrder.created_at.desc()).all()
        
        result = []
        for so in orders:
            try:
                result.append(format_sales_order_response(so))
            except Exception as row_err:
                print(f"⚠️ Error formatting SO {getattr(so, 'id', 'unknown')}: {row_err}")
                continue
        return result
    except Exception as e:
        print(f"⚠️ Error fetching Sales Orders: {e}")
        return []

@router.post("/orders", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PPIC", "ADMIN", "OWNER", "DEVELOPER"]))
):
    # Auto-generate SO Number jika tidak disediakan (SO-MG26xxxx)
    so_num = payload.so_number
    if not so_num:
        count_so = db.query(models.SalesOrder).count() + 1
        so_num = f"SO-MG26{count_so:04d}"

    # Auto hitung order_qty jika matrix breakdown diberikan
    calc_qty = payload.order_qty
    if payload.size_breakdown_target:
        matrix_sum = sum(payload.size_breakdown_target.values())
        if matrix_sum > 0:
            calc_qty = matrix_sum

    # Auto kalkulasi total_order_value (CMT/FOB Price x Qty - Discount + PPN)
    subtotal = calc_qty * (payload.unit_price or 0.0)
    disc = payload.discount_amount or 0.0
    tax = (subtotal - disc) * ((payload.tax_ppn_pct or 0.0) / 100.0)
    calc_total_val = payload.total_order_value or max(0.0, subtotal - disc + tax)

    new_so = models.SalesOrder(
        so_number=so_num.upper(),
        buyer_id=payload.buyer_id,
        buyer_po_number=payload.buyer_po_number,
        customer_pic_name=payload.customer_pic_name,
        customer_pic_phone=payload.customer_pic_phone,
        customer_email=payload.customer_email,
        delivery_address=payload.delivery_address,
        style_name=payload.style_name.upper(),
        item_category=payload.item_category.upper() if payload.item_category else "LONG JEANS",
        color=payload.color.upper() if payload.color else "-",
        fabric_type=payload.fabric_type,
        target_shrinkage_pct=payload.target_shrinkage_pct or 0.0,
        special_instructions=payload.special_instructions,
        contract_type=payload.contract_type.upper() if payload.contract_type else "CMT",
        order_qty=calc_qty,
        unit_price=payload.unit_price or 0.0,
        total_order_value=calc_total_val,
        dp_amount=payload.dp_amount or 0.0,
        payment_terms=payload.payment_terms or "NET_30",
        tax_ppn_pct=payload.tax_ppn_pct or 0.0,
        discount_amount=payload.discount_amount or 0.0,
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
        catatan=f"Sales Order '{new_so.so_number}' ({new_so.style_name} - {new_so.order_qty} pcs, Kontrak: {new_so.contract_type}, Nilai: Rp {new_so.total_order_value:,.0f}) dibuat oleh {current_user.nama}."
    )

    return format_sales_order_response(new_so)

@router.get("/orders/{so_id}", response_model=SalesOrderResponse)
def get_sales_order_detail(
    so_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).options(joinedload(models.SalesOrder.buyer)).filter(models.SalesOrder.id == so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")
    
    return format_sales_order_response(so)

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
            if k in ["style_name", "item_category", "contract_type"]:
                setattr(so, k, str(v).upper())
            else:
                setattr(so, k, v)

    if payload.size_breakdown_target:
        matrix_sum = sum(payload.size_breakdown_target.values())
        if matrix_sum > 0:
            so.order_qty = matrix_sum

    # Recalculate total_order_value jika tidak dispesifikasikan manual
    if "total_order_value" not in update_data:
        subtotal = (so.order_qty or 0) * (so.unit_price or 0.0)
        disc = so.discount_amount or 0.0
        tax = (subtotal - disc) * ((so.tax_ppn_pct or 0.0) / 100.0)
        so.total_order_value = max(0.0, subtotal - disc + tax)

    db.commit()
    db.refresh(so)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_SALES_ORDER",
        target_id=so.so_number,
        catatan=f"Sales Order '{so.so_number}' dikoreksi oleh {current_user.nama} (Style: {old_style}->{so.style_name}, Qty: {old_qty}->{so.order_qty} pcs, DL: {so.deadline})."
    )
    
    return format_sales_order_response(so)

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
