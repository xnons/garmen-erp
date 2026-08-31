from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from database import get_db
import models
from core.deps import require_roles
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/payroll", tags=["Payroll & Gaji"])

class MarkPaidRequest(BaseModel):
    periode_gaji: str  # Format: "YYYY-MM"
    catatan_pembayaran: Optional[str] = None


# ===========================================================================
# 1️⃣ REKAPITULASI GAJI BULANAN (DENGAN FILTER TIPE PAY)
# ===========================================================================
@router.get("/summary")
def get_payroll_summary(
    periode: str,  # Query param: "2026-08"
    tipe_pay: Optional[str] = "ALL",  # ALL, BORONGAN, BULANAN, HARIAN
    search: Optional[str] = "",
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "FINANCE", "DEVELOPER"]))
):
    try:
        year, month = map(int, periode.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Format periode harus YYYY-MM")

    query = db.query(models.Karyawan).filter(models.Karyawan.is_active == True)

    if tipe_pay and tipe_pay.upper() != "ALL":
        query = query.filter(func.upper(models.Karyawan.tipe_pay) == tipe_pay.upper())

    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(models.Karyawan.nama).like(search_fmt)) |
            (func.lower(models.Karyawan.id_karyawan).like(search_fmt)) |
            (func.lower(models.Karyawan.jabatan).like(search_fmt))
        )

    karyawan_list = query.order_by(models.Karyawan.nama.asc()).all()

    items = []
    total_output_pcs_all = 0
    total_pengeluaran_gaji_all = 0.0

    for k in karyawan_list:
        tipe = (k.tipe_pay or "BULANAN").upper()
        total_pcs = 0
        gaji_kalkulasi = 0.0

        # 1. Agregasi dari PieceRateWage (Garment Blueprint: Sewing, Obras, Steam, Kancing, Potong, Lipat, Packing, Press)
        piece_stats = db.query(
            func.coalesce(func.sum(models.PieceRateWage.qty_completed), 0).label("total_pcs"),
            func.coalesce(func.sum(models.PieceRateWage.total_wage), 0.0).label("total_wage")
        ).filter(
            models.PieceRateWage.operator_id == k.id_karyawan,
            extract('year', models.PieceRateWage.work_date) == year,
            extract('month', models.PieceRateWage.work_date) == month
        ).first()

        piece_pcs = int(piece_stats.total_pcs or 0) if piece_stats else 0
        piece_wage = float(piece_stats.total_wage or 0.0) if piece_stats else 0.0

        # 2. Agregasi dari CuttingPrepTask (Numbering, Press Interlining Silma/Anzani)
        prep_stats = db.query(
            func.coalesce(func.sum(models.CuttingPrepTask.qty_done), 0).label("total_pcs"),
            func.coalesce(func.sum(models.CuttingPrepTask.total_wage), 0.0).label("total_wage")
        ).filter(
            models.CuttingPrepTask.operator_id == k.id_karyawan,
            extract('year', models.CuttingPrepTask.task_date) == year,
            extract('month', models.CuttingPrepTask.task_date) == month
        ).first()

        prep_pcs = int(prep_stats.total_pcs or 0) if prep_stats else 0
        prep_wage = float(prep_stats.total_wage or 0.0) if prep_stats else 0.0

        # 3. Agregasi dari LogOutputBorongan (Legacy system)
        legacy_stats = db.query(
            func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0).label("total_pcs"),
            func.coalesce(func.sum(models.LogOutputBorongan.subtotal_rp), 0.0).label("total_subtotal")
        ).filter(
            models.LogOutputBorongan.karyawan_id == k.id_karyawan,
            models.LogOutputBorongan.is_deleted == False,
            models.LogOutputBorongan.status_verifikasi == "APPROVED",
            extract('year', models.LogOutputBorongan.tanggal) == year,
            extract('month', models.LogOutputBorongan.tanggal) == month
        ).first()

        legacy_pcs = int(legacy_stats.total_pcs or 0) if legacy_stats else 0
        legacy_subtotal = float(legacy_stats.total_subtotal or 0.0) if legacy_stats else 0.0

        total_pcs = piece_pcs + prep_pcs + legacy_pcs
        total_borongan_wage = piece_wage + prep_wage + legacy_subtotal

        if tipe == "BORONGAN":
            if total_borongan_wage > 0:
                gaji_kalkulasi = total_borongan_wage
            else:
                tarif = float(k.tarif_borongan_pcs or 0)
                gaji_kalkulasi = total_pcs * tarif

        elif tipe == "BULANAN":
            gaji_kalkulasi = float(k.gaji_pokok or 0)
            # Jika karyawan bulanan juga dapat upah borongan tambahan
            if total_borongan_wage > 0:
                gaji_kalkulasi += total_borongan_wage

        elif tipe == "HARIAN":
            total_hadir = int(k.total_hadir or 0)
            tarif_harian = float(k.gaji_pokok or 0)
            gaji_kalkulasi = (total_hadir * tarif_harian) + total_borongan_wage

        total_output_pcs_all += total_pcs
        total_pengeluaran_gaji_all += gaji_kalkulasi

        items.append({
            "id_karyawan": k.id_karyawan,
            "nama": k.nama,
            "jabatan": k.jabatan,
            "tipe_pay": tipe,
            "gaji_pokok": float(k.gaji_pokok or 0),
            "tarif_borongan_pcs": float(k.tarif_borongan_pcs or 0),
            "total_pcs_bulan_ini": total_pcs,
            "total_gaji": gaji_kalkulasi
        })

    return {
        "periode": periode,
        "total_karyawan": len(karyawan_list),
        "total_output_pcs": total_output_pcs_all,
        "total_tagihan_gaji": total_pengeluaran_gaji_all,
        "detail_karyawan": items
    }


# ===========================================================================
# 2️⃣ RIWAYAT / LOG HISTORY PENCAIRAN PAYROLL (BISA FILTER PERIODE)
# ===========================================================================
@router.get("/history")
def get_payroll_history(
    periode: Optional[str] = None,  # Query param opsional: "2026-08"
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "FINANCE", "DEVELOPER"]))
):
    query = db.query(models.LogAudit).filter(models.LogAudit.aksi == "PAYROLL_PAID")

    if periode and periode.upper() != "ALL":
        query = query.filter(models.LogAudit.target_id == periode)

    logs = query.order_by(models.LogAudit.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": log.id,
            "waktu": log.timestamp,
            "eksekutor_id": log.actor_id,
            "periode": log.target_id,
            "catatan": log.catatan
        }
        for log in logs
    ]


# ===========================================================================
# 3️⃣ EKSEKUSI PENCAIRAN GAJI & REKAM AUDIT TRAIL
# ===========================================================================
@router.post("/mark-paid")
def mark_payroll_paid(
    data: MarkPaidRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "FINANCE", "DEVELOPER"]))
):
    try:
        year, month = map(int, data.periode_gaji.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Format periode harus YYYY-MM")

    payroll_batch_id = f"PAY-{data.periode_gaji}"

    # 1. Update flag is_paid pada LogOutputBorongan yang approved dalam periode ini
    logs_to_update = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.is_deleted == False,
        models.LogOutputBorongan.status_verifikasi == "APPROVED",
        extract('year', models.LogOutputBorongan.tanggal) == year,
        extract('month', models.LogOutputBorongan.tanggal) == month
    ).all()

    for log in logs_to_update:
        log.is_paid = True
        log.payroll_id = payroll_batch_id
        log.paid_at = func.now()

    # 2. Rekap dan simpan ke LogPayrollProduksi per pekerja
    karyawan_active = db.query(models.Karyawan).filter(models.Karyawan.is_active == True).all()
    for k in karyawan_active:
        user_logs = [l for l in logs_to_update if l.karyawan_id == k.id_karyawan]
        pcs_pass = sum(l.qty_pass for l in user_logs)
        nominal_rp = sum(l.subtotal_rp for l in user_logs)
        
        if k.tipe_pay == "BULANAN":
            nominal_rp = float(k.gaji_pokok or 0)
        elif k.tipe_pay == "HARIAN":
            nominal_rp = float((k.total_hadir or 0) * (k.gaji_pokok or 0))

        if nominal_rp > 0 or pcs_pass > 0:
            log_payroll = models.LogPayrollProduksi(
                id=f"{payroll_batch_id}-{k.id_karyawan}",
                karyawan_id=k.id_karyawan,
                total_setoran_approved=len(user_logs),
                total_pcs_pass=pcs_pass,
                total_nominal_rp=nominal_rp,
                metode_bayar="TRANSFER",
                keterangan=data.catatan_pembayaran or f"Gaji Periode {data.periode_gaji}",
                disetujui_oleh=current_user.nama
            )
            # Merge / add
            db.merge(log_payroll)

    # 3. Catat audit trail
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="PAYROLL_PAID",
        target_id=data.periode_gaji,
        catatan=f"Pencairan gaji periode {data.periode_gaji} untuk {len(karyawan_active)} karyawan dieksekusi oleh {current_user.nama}. Keterangan: {data.catatan_pembayaran or 'Pencairan rutin bulanan'}"
    )

    db.commit()

    return {
        "status": "success",
        "message": f"Payroll periode {data.periode_gaji} berhasil dicairkan dan terekam di Log Keamanan.",
        "actor": current_user.nama,
        "periode": data.periode_gaji,
        "total_setoran_terbayar": len(logs_to_update)
    }