# backend/routers/wip_subcon.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
import models
from schemas.garment_blueprint import (
    WIPDispatchCreate, WIPReceiveCreate, WIPMovementResponse, WIPMatrixRow
)
from core.security import get_current_user, require_role
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/wip", tags=["WIP & Subcon Pipeline Movements"])

# ---------------------------------------------------------------------------
# 1. DISPATCH / SURAT JALAN KIRIM KE SUBCON / JAHIT
# ---------------------------------------------------------------------------
@router.get("/movements", response_model=List[WIPMovementResponse])
def get_wip_movements(
    so_id: Optional[str] = None,
    stage_name: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.WIPMovement).options(
        joinedload(models.WIPMovement.sales_order),
        joinedload(models.WIPMovement.partner),
        joinedload(models.WIPMovement.supervisor)
    )
    if so_id:
        query = query.filter(models.WIPMovement.so_id == so_id)
    if stage_name:
        query = query.filter(models.WIPMovement.stage_name == stage_name.upper())
    if status_filter:
        query = query.filter(models.WIPMovement.status == status_filter.upper())
        
    movements = query.order_by(models.WIPMovement.dispatch_date.desc()).all()

    result = []
    for m in movements:
        m_dict = WIPMovementResponse.from_orm(m)
        if m.sales_order:
            m_dict.so_number = m.sales_order.so_number
            m_dict.style_name = m.sales_order.style_name
        if m.partner:
            m_dict.partner_name = m.partner.name
        if m.supervisor:
            m_dict.supervisor_name = m.supervisor.nama
        result.append(m_dict)
    return result

@router.post("/dispatch", response_model=WIPMovementResponse, status_code=status.HTTP_201_CREATED)
def create_wip_dispatch(
    payload: WIPDispatchCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == payload.so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    # Tentukan sequence_order otomatis berdasarkan tahapan
    stage_seq_map = {
        "PRINT_MENTAH": 1,
        "EMBROIDERY_MENTAH": 2,
        "SEWING_INTERNAL": 3,
        "SEWING_MAKLUN": 3,
        "WASHING": 4,
        "EMBROIDERY_JADI": 5,
        "FINISHING": 6
    }
    seq = stage_seq_map.get(payload.stage_name.upper(), payload.sequence_order or 1)
    sj_num = payload.surat_jalan_no or f"SJ-{payload.stage_name[:3].upper()}-{datetime.utcnow().strftime('%y%m%d%H%M')}"

    movement = models.WIPMovement(
        so_id=payload.so_id,
        stage_name=payload.stage_name.upper(),
        sequence_order=seq,
        partner_id=payload.partner_id,
        internal_supervisor_id=current_user.id_karyawan,
        surat_jalan_no=sj_num,
        dispatch_date=payload.dispatch_date,
        qty_dispatched=payload.qty_dispatched,
        size_breakdown_dispatched=payload.size_breakdown_dispatched or {},
        status="IN_PROCESS",
        remarks=payload.remarks
    )
    db.add(movement)
    
    # Update SO status
    if "SEWING" in payload.stage_name.upper():
        so.status = "SEWING"
    elif "WASHING" in payload.stage_name.upper():
        so.status = "WASHING"
    elif "FINISHING" in payload.stage_name.upper():
        so.status = "FINISHING"
    else:
        so.status = "WIP_SUBCON"

    db.commit()
    db.refresh(movement)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="WIP_DISPATCH",
        target_id=movement.id,
        catatan=f"Surat Jalan Kirim {payload.qty_dispatched} pcs ke {payload.stage_name} (SJ: {sj_num}) untuk SO '{so.so_number}'."
    )

    resp = WIPMovementResponse.from_orm(movement)
    resp.so_number = so.so_number
    resp.style_name = so.style_name
    resp.supervisor_name = current_user.nama
    return resp


# ---------------------------------------------------------------------------
# 2. RECEIVE / SURAT JALAN TERIMA DARI SUBCON DENGAN VALIDASI SELISIH
# ---------------------------------------------------------------------------
@router.put("/movements/{movement_id}/receive", response_model=WIPMovementResponse)
def receive_wip_movement(
    movement_id: str,
    payload: WIPReceiveCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    movement = db.query(models.WIPMovement).options(
        joinedload(models.WIPMovement.sales_order),
        joinedload(models.WIPMovement.partner)
    ).filter(models.WIPMovement.id == movement_id).first()

    if not movement:
        raise HTTPException(status_code=404, detail="Surat Jalan pergerakan WIP tidak ditemukan.")

    qty_rec = payload.qty_received
    qty_rej = payload.qty_reject or 0

    # 🟢 RUMUS REKONSILIASI SELISIH MAKLUN (Mendukung Pengiriman Bertahap / Partial Receive):
    # balance_discrepancy = qty_dispatched - (qty_received + qty_reject)
    discrepancy = movement.qty_dispatched - (qty_rec + qty_rej)

    movement.received_date = payload.received_date
    movement.qty_received = qty_rec
    movement.qty_reject = qty_rej
    movement.size_breakdown_received = payload.size_breakdown_received or {}
    movement.balance_discrepancy = discrepancy
    
    if (qty_rec + qty_rej) < movement.qty_dispatched and discrepancy > 0:
        # Jika baru setor sebagian (partial batch delivery)
        movement.status = "PARTIAL_RECEIVED"
    elif discrepancy == 0:
        movement.status = "COMPLETED"
    else:
        movement.status = "DISCREPANCY_FLAG"

    if payload.remarks:
        movement.remarks = f"{movement.remarks or ''} | Terima: {payload.remarks}"

    # Catat log rijek jika ada kerusakan barang
    if qty_rej > 0:
        reject_entry = models.RejectLog(
            wip_movement_id=movement.id,
            so_id=movement.so_id,
            stage_name=f"{movement.stage_name}_DEFECT",
            defect_reason=payload.defect_reason or "CACAT_PROSES_MAKLUN",
            qty_reject=qty_rej,
            unit_cost_loss=15000.0,
            total_loss=qty_rej * 15000.0
        )
        db.add(reject_entry)

    db.commit()
    db.refresh(movement)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="WIP_RECEIVE",
        target_id=movement.id,
        catatan=f"Terima {qty_rec} pcs (Rijek: {qty_rej}, Selisih: {discrepancy}) dari {movement.stage_name} untuk SO '{movement.sales_order.so_number}'."
    )

    resp = WIPMovementResponse.from_orm(movement)
    if movement.sales_order:
        resp.so_number = movement.sales_order.so_number
        resp.style_name = movement.sales_order.style_name
    if movement.partner:
        resp.partner_name = movement.partner.name
    resp.supervisor_name = getattr(movement.supervisor, "nama", current_user.nama)
    return resp

@router.put("/movements/{movement_id}", response_model=WIPMovementResponse)
def update_wip_movement(
    movement_id: str,
    payload: WIPMovementUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["PPIC", "ADMIN", "OWNER", "DEVELOPER"]))
):
    movement = db.query(models.WIPMovement).options(
        joinedload(models.WIPMovement.sales_order),
        joinedload(models.WIPMovement.partner)
    ).filter(models.WIPMovement.id == movement_id).first()
    if not movement:
        raise HTTPException(status_code=404, detail="Surat Jalan pergerakan WIP tidak ditemukan.")

    old_dispatch = movement.qty_dispatched
    old_rec = movement.qty_received

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(movement, k, v)

    # Rekalkulasi Selisih
    movement.balance_discrepancy = (movement.qty_dispatched or 0) - ((movement.qty_received or 0) + (movement.qty_reject or 0))
    if movement.qty_received and movement.qty_received > 0:
        if movement.balance_discrepancy == 0:
            movement.status = "COMPLETED"
        elif movement.balance_discrepancy > 0:
            movement.status = "PARTIAL_RECEIVED"
        else:
            movement.status = "DISCREPANCY_FLAG"

    db.commit()
    db.refresh(movement)

    so_num = movement.sales_order.so_number if movement.sales_order else "N/A"
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_WIP_MOVEMENT",
        target_id=movement.id,
        catatan=f"Surat Jalan #{movement.surat_jalan_no or movement_id} (SO: {so_num}) dikoreksi oleh {current_user.nama} (Kirim: {old_dispatch}->{movement.qty_dispatched}, Terima: {old_rec}->{movement.qty_received})."
    )

    resp = WIPMovementResponse.from_orm(movement)
    if movement.sales_order:
        resp.so_number = movement.sales_order.so_number
        resp.style_name = movement.sales_order.style_name
    if movement.partner:
        resp.partner_name = movement.partner.name
    resp.supervisor_name = getattr(movement.supervisor, "nama", current_user.nama)
    return resp

@router.delete("/movements/{movement_id}")
def delete_wip_movement(
    movement_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    movement = db.query(models.WIPMovement).filter(models.WIPMovement.id == movement_id).first()
    if not movement:
        raise HTTPException(status_code=404, detail="Surat Jalan tidak ditemukan.")

    sj_no = movement.surat_jalan_no
    db.delete(movement)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_WIP_MOVEMENT",
        target_id=movement_id,
        catatan=f"Surat Jalan {sj_no} (#{movement_id}) dihapus oleh {current_user.nama}."
    )
    return {"message": f"Surat Jalan '{sj_no}' berhasil dihapus."}


# ---------------------------------------------------------------------------
# 3. MASTER CONTROL TOWER (LIVE WIP MATRIX TELEMETRY AGGREGATION)
# ---------------------------------------------------------------------------
@router.get("/monitoring-matrix", response_model=List[WIPMatrixRow])
def get_master_control_tower_matrix(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Menghasilkan matriks komprehensif telemetri WIP real-time untuk seluruh Sales Order aktif:
    Order -> Cutting -> Print M -> Bordir M -> Kirim Jahit -> Setor Jahit -> Washing -> Finishing -> Shipped -> Rijek
    """
    orders = db.query(models.SalesOrder).options(
        joinedload(models.SalesOrder.buyer)
    ).order_by(models.SalesOrder.created_at.desc()).all()

    matrix_rows = []
    for so in orders:
        # 1. Total Cutting
        cutting_recs = db.query(models.CuttingRecord).filter(models.CuttingRecord.so_id == so.id).all()
        total_cut = sum(c.qty_cut for c in cutting_recs)

        # 2. Pergerakan WIP Subkon
        wip_recs = db.query(models.WIPMovement).filter(models.WIPMovement.so_id == so.id).all()

        print_m = sum(w.qty_received for w in wip_recs if w.stage_name == "PRINT_MENTAH")
        bordir_m = sum(w.qty_received for w in wip_recs if w.stage_name == "EMBROIDERY_MENTAH")
        kirim_jahit = sum(w.qty_dispatched for w in wip_recs if "SEWING" in w.stage_name)
        setor_jahit = sum(w.qty_received for w in wip_recs if "SEWING" in w.stage_name)
        washing = sum(w.qty_received for w in wip_recs if w.stage_name == "WASHING")
        finishing = sum(w.qty_received for w in wip_recs if w.stage_name == "FINISHING")
        
        # 3. Total Shipped
        shipment_recs = db.query(models.Shipment).filter(models.Shipment.so_id == so.id).all()
        total_shipped = sum(s.total_qty_shipped for s in shipment_recs)

        # 4. Total Reject & Discrepancy
        total_reject = sum(w.qty_reject for w in wip_recs)
        total_disc = sum(w.balance_discrepancy for w in wip_recs)

        matrix_rows.append(WIPMatrixRow(
            so_id=so.id,
            so_number=so.so_number,
            buyer_name=so.buyer.name if so.buyer else "UMUM",
            style_name=so.style_name,
            item_category=so.item_category or "LONG JEANS",
            order_qty=so.order_qty,
            qty_cutting=total_cut,
            qty_print_mentah=print_m,
            qty_bordir_mentah=bordir_m,
            qty_kirim_jahit=kirim_jahit,
            qty_setor_jahit=setor_jahit,
            qty_washing=washing,
            qty_finishing=finishing,
            qty_shipped=total_shipped,
            qty_reject_total=total_reject,
            balance_discrepancy_total=total_disc,
            status_wip=so.status
        ))

    return matrix_rows
