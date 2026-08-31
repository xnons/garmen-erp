# backend/routers/cutting_prep.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
import models
from schemas.garment_blueprint import (
    CuttingRecordCreate, CuttingRecordUpdate, CuttingRecordResponse,
    CuttingPrepTaskCreate, CuttingPrepTaskUpdate, CuttingPrepTaskResponse
)
from core.security import get_current_user, require_role
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/cutting", tags=["Cutting, Consumption & Preparation"])

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

def format_cutting_record_response(cr: models.CuttingRecord, default_op_name: Optional[str] = None) -> CuttingRecordResponse:
    op_name = cr.operator.nama if (hasattr(cr, "operator") and cr.operator) else default_op_name
    return CuttingRecordResponse(
        id=str(cr.id),
        so_id=cr.so_id,
        cutting_date=cr.cutting_date,
        operator_id=cr.operator_id,
        operator_name=op_name,
        qty_cut=cr.qty_cut or 0,
        size_breakdown_cut=parse_json_safely(cr.size_breakdown_cut, {}),
        main_fabric_used=cr.main_fabric_used or 0.0,
        puring_used=cr.puring_used or 0.0,
        puring_jala_used=cr.puring_jala_used or 0.0,
        main_consumption_rate=cr.main_consumption_rate or 0.0,
        puring_consumption_rate=cr.puring_consumption_rate or 0.0,
        marker_length_yard=cr.marker_length_yard or 0.0,
        marker_efficiency_pct=cr.marker_efficiency_pct or 0.0,
        gelaran_layers=cr.gelaran_layers or 1,
        fabric_waste_yards=cr.fabric_waste_yards or 0.0,
        created_at=cr.created_at
    )

def format_prep_task_response(t: models.CuttingPrepTask, default_op_name: Optional[str] = None) -> CuttingPrepTaskResponse:
    op_name = t.operator.nama if (hasattr(t, "operator") and t.operator) else default_op_name
    return CuttingPrepTaskResponse(
        id=str(t.id),
        so_id=t.so_id,
        task_type=t.task_type or "NUMBERING",
        operator_id=t.operator_id,
        operator_name=op_name,
        task_date=t.task_date,
        qty_done=t.qty_done or 0,
        size_breakdown=parse_json_safely(t.size_breakdown, {}),
        piece_rate=t.piece_rate or 0.0,
        total_wage=t.total_wage or 0.0,
        created_at=t.created_at
    )

# ---------------------------------------------------------------------------
# 1. CUTTING LOG & CONSUMPTION CALCULATION
# ---------------------------------------------------------------------------
@router.get("/records", response_model=List[CuttingRecordResponse])
def get_cutting_records(
    so_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.CuttingRecord).options(
        joinedload(models.CuttingRecord.operator)
    )
    if so_id:
        query = query.filter(models.CuttingRecord.so_id == so_id)
    records = query.order_by(models.CuttingRecord.cutting_date.desc()).all()

    return [format_cutting_record_response(cr, current_user.nama) for cr in records]

@router.post("/records", response_model=CuttingRecordResponse, status_code=status.HTTP_201_CREATED)
def create_cutting_record(
    payload: CuttingRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == payload.so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    if payload.qty_cut <= 0:
        raise HTTPException(status_code=400, detail="Jumlah potong (qty_cut) harus lebih dari 0.")

    # 🟢 KALKULASI RASIO KONSUMSI KAIN UTAMA & PURING:
    main_rate = round(payload.main_fabric_used / payload.qty_cut, 4)
    puring_rate = round((payload.puring_used or 0.0) / payload.qty_cut, 4) if (payload.puring_used and payload.puring_used > 0) else 0.0

    assigned_operator_id = payload.operator_id or current_user.id_karyawan
    operator_obj = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == assigned_operator_id).first()
    operator_name = operator_obj.nama if operator_obj else current_user.nama

    cutting = models.CuttingRecord(
        so_id=payload.so_id,
        cutting_date=payload.cutting_date,
        operator_id=assigned_operator_id,
        qty_cut=payload.qty_cut,
        size_breakdown_cut=payload.size_breakdown_cut or {},
        main_fabric_used=payload.main_fabric_used,
        puring_used=payload.puring_used or 0.0,
        puring_jala_used=payload.puring_jala_used or 0.0,
        main_consumption_rate=main_rate,
        puring_consumption_rate=puring_rate,
        marker_length_yard=payload.marker_length_yard or 0.0,
        marker_efficiency_pct=payload.marker_efficiency_pct or 0.0,
        gelaran_layers=payload.gelaran_layers or 1,
        fabric_waste_yards=payload.fabric_waste_yards or 0.0
    )
    db.add(cutting)
    db.commit()
    db.refresh(cutting)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CUTTING_RECORD",
        target_id=cutting.id,
        catatan=f"Potong {payload.qty_cut} pcs oleh '{operator_name}' untuk SO '{so.so_number}'. Konsumsi Utama: {main_rate} Yd/Pcs, Puring: {puring_rate} Yd/Pcs."
    )

    return format_cutting_record_response(cutting, operator_name)

@router.put("/records/{record_id}", response_model=CuttingRecordResponse)
def update_cutting_record(
    record_id: str,
    payload: CuttingRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["CUTTING", "ADMIN", "OWNER", "DEVELOPER"]))
):
    cutting = db.query(models.CuttingRecord).options(
        joinedload(models.CuttingRecord.operator)
    ).filter(models.CuttingRecord.id == record_id).first()
    if not cutting:
        raise HTTPException(status_code=404, detail="Data potong tidak ditemukan.")

    old_qty = cutting.qty_cut
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            setattr(cutting, k, v)

    # Rekalkulasi Rasio Konsumsi
    if cutting.qty_cut and cutting.qty_cut > 0:
        cutting.main_consumption_rate = round((cutting.main_fabric_used or 0.0) / cutting.qty_cut, 4)
        if cutting.puring_used:
            cutting.puring_consumption_rate = round(cutting.puring_used / cutting.qty_cut, 4)

    db.commit()
    db.refresh(cutting)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_CUTTING",
        target_id=cutting.id,
        catatan=f"Koreksi log potong #{record_id} oleh {current_user.nama} (Qty: {old_qty}->{cutting.qty_cut} pcs, Konsumsi: {cutting.main_consumption_rate} Yd/Pcs)."
    )

    return format_cutting_record_response(cutting, current_user.nama)

@router.delete("/records/{record_id}")
def delete_cutting_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    cutting = db.query(models.CuttingRecord).filter(models.CuttingRecord.id == record_id).first()
    if not cutting:
        raise HTTPException(status_code=404, detail="Data potong kain tidak ditemukan.")
    
    qty = cutting.qty_cut
    db.delete(cutting)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_CUTTING",
        target_id=record_id,
        catatan=f"Log meja potong #{record_id} ({qty} pcs) dihapus oleh {current_user.nama}."
    )
    return {"message": "Data potong berhasil dihapus."}


# ---------------------------------------------------------------------------
# 2. PREPARATION TASKS (NUMBERING & PRESS INTERLINING WAGES)
# ---------------------------------------------------------------------------
@router.get("/prep-tasks", response_model=List[CuttingPrepTaskResponse])
def get_prep_tasks(
    so_id: Optional[str] = None,
    task_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.CuttingPrepTask).options(
        joinedload(models.CuttingPrepTask.operator)
    )
    if so_id:
        query = query.filter(models.CuttingPrepTask.so_id == so_id)
    if task_type:
        query = query.filter(models.CuttingPrepTask.task_type == task_type.upper())
    tasks = query.order_by(models.CuttingPrepTask.task_date.desc()).all()

    return [format_prep_task_response(t, current_user.nama) for t in tasks]

@router.post("/prep-tasks", response_model=CuttingPrepTaskResponse, status_code=status.HTTP_201_CREATED)
def create_prep_task(
    payload: CuttingPrepTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    so = db.query(models.SalesOrder).filter(models.SalesOrder.id == payload.so_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Sales Order tidak ditemukan.")

    assigned_operator_id = payload.operator_id or current_user.id_karyawan
    operator_obj = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == assigned_operator_id).first()
    operator_name = operator_obj.nama if operator_obj else current_user.nama

    rate = payload.piece_rate or (150.0 if payload.task_type.upper() == "NUMBERING" else 250.0)
    total_gaji = round(payload.qty_done * rate, 2)

    task = models.CuttingPrepTask(
        so_id=payload.so_id,
        task_type=payload.task_type.upper(),
        operator_id=assigned_operator_id,
        task_date=payload.task_date,
        qty_done=payload.qty_done,
        size_breakdown=payload.size_breakdown or {},
        piece_rate=rate,
        total_wage=total_gaji
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="CREATE_PREP_TASK",
        target_id=task.id,
        catatan=f"Tugas persiapan {payload.task_type} ({payload.qty_done} pcs) oleh {operator_name} didaftarkan."
    )

    return format_prep_task_response(task, operator_name)

@router.put("/prep-tasks/{task_id}", response_model=CuttingPrepTaskResponse)
def update_prep_task(
    task_id: str,
    payload: CuttingPrepTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["CUTTING", "ADMIN", "OWNER", "DEVELOPER"]))
):
    task = db.query(models.CuttingPrepTask).options(
        joinedload(models.CuttingPrepTask.operator)
    ).filter(models.CuttingPrepTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tugas persiapan cutting tidak ditemukan.")

    old_qty = task.qty_done
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if v is not None:
            if k == "task_type":
                setattr(task, k, str(v).upper())
            else:
                setattr(task, k, v)

    # Rekalkulasi Gaji Borongan
    rate = task.piece_rate or 0.0
    task.total_wage = round((task.qty_done or 0) * rate, 2)

    db.commit()
    db.refresh(task)

    op_name = task.operator.nama if task.operator else current_user.nama
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="UPDATE_PREP_TASK",
        target_id=task.id,
        catatan=f"Tugas persiapan #{task_id} ({task.task_type}) dikoreksi oleh {current_user.nama} (Qty: {old_qty} -> {task.qty_done} pcs, Total Upah: Rp {task.total_wage:,.0f})."
    )

    return format_prep_task_response(task, op_name)

@router.delete("/prep-tasks/{task_id}")
def delete_prep_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["ADMIN", "OWNER", "DEVELOPER"]))
):
    task = db.query(models.CuttingPrepTask).filter(models.CuttingPrepTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tugas persiapan tidak ditemukan.")
    
    t_type = task.task_type
    db.delete(task)
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_PREP_TASK",
        target_id=task_id,
        catatan=f"Tugas persiapan {t_type} #{task_id} dihapus oleh {current_user.nama}."
    )
    return {"message": f"Tugas persiapan '{t_type}' berhasil dihapus."}
