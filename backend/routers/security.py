import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
from core.security import get_password_hash, verify_password, get_current_user
import models
from schemas.security import PinVerifySchema, PinUpdateSchema

# Membuka prefix /api/security
router = APIRouter(prefix="/api/security", tags=["System Security Gate"])


# 1️⃣ VERIFIKASI MASTER PIN
@router.post("/verify-pin")
def verify_master_pin(
    payload: PinVerifySchema, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: models.Karyawan = Depends(get_current_user)
):
    user_role = getattr(current_user, 'role', '').upper()
    
    # Hak Akses Gate: Admin, Owner, Developer
    if user_role not in ['ADMIN', 'OWNER', 'DEVELOPER']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses Ditolak! Role Anda tidak memiliki wewenang ke Security Gate."
        )

    # -------------------------------------------------------------------
    # ⚡ UNIVERSAL PIN '6767' KHUSUS DEVELOPER & DEV MODE PERANGKAT
    # -------------------------------------------------------------------
    if payload.pin == "6767":
        dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
        
        # Loloskan HANYA jika Role = DEVELOPER dan DEV_MODE = true
        if user_role == "DEVELOPER" and dev_mode:
            return {
                "status": "success", 
                "message": "PIN Universal Developer Valid. Akses Dev Mode Aktif."
            }
        
        # Jika ADMIN/OWNER yang mencoba memasukkan 6767, langsung ditolak!
        if user_role != "DEVELOPER":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="PIN Security Gate Salah!"
            )

    # -------------------------------------------------------------------
    # 🔒 VERIFIKASI MASTER PIN REGULER (Database Check)
    # -------------------------------------------------------------------
    sec_record = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
    
    if not sec_record:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Master PIN belum diinisialisasi di sistem."
        )

    if not verify_password(payload.pin, sec_record.master_pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="PIN Security Gate Salah!"
        )

    return {"status": "success", "message": "PIN Valid. Akses diberikan."}


# 2️⃣ UBAH MASTER PIN
@router.put("/update-pin")
def update_master_pin(
    payload: PinUpdateSchema, 
    db: Session = Depends(get_db), 
    current_user: models.Karyawan = Depends(get_current_user)
):
    user_role = getattr(current_user, 'role', '').upper()
    
    # Hak Akses Ubah PIN: Khusus Owner & Developer
    if user_role not in ['OWNER', 'DEVELOPER']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses Ditolak! Hanya OWNER atau DEVELOPER yang berhak mengubah Master PIN."
        )

    sec_record = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
    
    # Inisialisasi otomatis jika record ID 1 belum ada
    if not sec_record:
        sec_record = models.SystemSecurity(
            id=1, 
            master_pin_hash=get_password_hash(payload.new_pin),
            updated_by=getattr(current_user, 'username', 'SYSTEM')
        )
        db.add(sec_record)
        db.commit()
        return {"status": "success", "message": "Master PIN berhasil dibuat!"}

    # -------------------------------------------------------------------
    # ⚡ DEVELOPER BYPASS PIN LAMA (Menggunakan 6767 saat update PIN)
    # -------------------------------------------------------------------
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    is_dev_bypass = (user_role == "DEVELOPER" and payload.old_pin == "6767" and dev_mode)

    # Validasi PIN Lama jika BUKAN bypass developer
    if not is_dev_bypass and not verify_password(payload.old_pin, sec_record.master_pin_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN Lama yang Anda masukkan salah!"
        )

    # Validasi agar PIN Baru tidak sama dengan PIN Lama
    if payload.old_pin == payload.new_pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN baru tidak boleh sama dengan PIN lama!"
        )

    # Simpan PIN Baru
    sec_record.master_pin_hash = get_password_hash(payload.new_pin)
    sec_record.updated_by = getattr(current_user, 'username', 'SYSTEM')
    if hasattr(sec_record, 'updated_at'):
        sec_record.updated_at = datetime.utcnow()
        
    db.commit()

    return {"status": "success", "message": "Master PIN berhasil diperbarui!"}