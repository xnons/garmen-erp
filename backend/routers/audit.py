from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from database import get_db
import models
from core.deps import require_roles

# Router Audit & Keamanan Sistem
router = APIRouter(prefix="/api/audit", tags=["Audit & Security Logs"])


# ===========================================================================
# 1️⃣ AMBIL RIWAYAT LOG LOGIN & SECURITY GUARD
# ===========================================================================
@router.get("/login-logs", response_model=List[dict])
def get_login_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER"]))
):
    """
    Mengambil riwayat percobaan login ke sistem.
    Mencakup status: SUCCESS, FAILED_PASSWORD, BLOCKED_OFF_HOURS, dll.
    Khusus untuk hak akses Owner dan Developer.
    """
    logs = db.query(models.LogLogin).order_by(models.LogLogin.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "karyawan_id": log.karyawan_id,
            "username": log.username,
            "timestamp": log.timestamp,
            "status": log.status,
            "ip_address": log.ip_address,
            "keterangan": log.keterangan
        }
        for log in logs
    ]


# ===========================================================================
# 2️⃣ AMBIL RIWAYAT AUDIT AKTIVITAS SENSITIF / DESTRUKTIF
# ===========================================================================
@router.get("/activity-logs", response_model=List[dict])
def get_activity_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER"]))
):
    """
    Mengambil riwayat aktivitas sensitif atau destruktif (Audit Trail).
    Contoh: Hapus SPK, Owner Finish SPK, Perubahan Harga, dll.
    Khusus untuk hak akses Owner dan Developer.
    """
    logs = db.query(models.LogAudit).order_by(models.LogAudit.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp,
            "actor_id": log.actor_id,
            "aksi": log.aksi,
            "target_id": log.target_id,
            "catatan": log.catatan
        }
        for log in logs
    ]