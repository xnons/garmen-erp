import os
import random
import string
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models
from schemas.karyawan import RegisterInput, LoginInput
from core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user_role,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(tags=["Autentikasi & Security Gate"])


# --- Pydantic Schemas Khusus PIN ---
class PinVerifyInput(BaseModel):
    pin: str

class ChangePinInput(BaseModel):
    old_pin: str
    new_pin: str


# 🟢 Helper Generator ID Karyawan Otomatis (Format: KRY-2026-XXX)
def generate_unique_id_karyawan(db: Session) -> str:
    while True:
        angka_acak = "".join(random.choices(string.digits, k=3))
        candidate_id = f"KRY-2026-{angka_acak}"
        
        # Cek apakah ID ini sudah ada di database
        exists = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == candidate_id).first()
        if not exists:
            return candidate_id


# 🔒 MATRIKS HIERARKI HAK PEMBUATAN ROLE (BACKEND GUARD)
ALLOWED_TARGET_ROLES = {
    "DEVELOPER": ["DEVELOPER", "OWNER", "ADMIN", "FINANCE", "GUDANG", "PRODUKSI", "KARYAWAN"],
    "OWNER": ["ADMIN", "FINANCE", "GUDANG", "PRODUKSI", "KARYAWAN"],
    "ADMIN": ["FINANCE", "GUDANG", "PRODUKSI", "KARYAWAN"]
}


# 🟢 1. Registrasi Karyawan (RBAC Hardened)
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_karyawan(
    user_data: RegisterInput, 
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    user_role = getattr(current_user, 'role', '').upper()

    # 1️⃣ Validasi Otoritas Pembuat (Harus Developer, Owner, atau Admin)
    if user_role not in ALLOWED_TARGET_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Akses ditolak! Anda tidak memiliki wewenang mendaftarkan pengguna."
        )

    # 2️⃣ 🛡️ VALIDASI HIERARKI ROLE TARGET (Mencegah Admin membuat Owner/Developer via API)
    target_role = user_data.role.upper()
    allowed_roles = ALLOWED_TARGET_ROLES[user_role]

    if target_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' tidak diizinkan mendaftarkan pengguna dengan role '{target_role}'!"
        )

    # 3️⃣ Cek Duplikasi Username
    karyawan_lama = db.query(models.Karyawan).filter(models.Karyawan.username == user_data.username).first()
    if karyawan_lama:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username tersebut sudah terdaftar!")
    
    final_id = user_data.id_karyawan or generate_unique_id_karyawan(db)
    hashed_password = get_password_hash(user_data.password)
    
    karyawan_baru = models.Karyawan(
        id_karyawan=final_id,
        nama=user_data.nama,
        username=user_data.username,
        hashed_password=hashed_password,
        pin=user_data.pin or "1234",
        role=target_role,
        is_active=True,
        
        jabatan=user_data.jabatan,
        umur=getattr(user_data, 'umur', None),
        no_hp=user_data.no_hp,
        alamat=user_data.alamat,
        status_karyawan=(user_data.status_karyawan or "KONTRAK").upper(),
        tanggal_masuk=user_data.tanggal_masuk,
        
        tipe_pay=(user_data.tipe_pay or "BORONGAN").upper(),
        gaji_pokok=user_data.gaji_pokok,
        tarif_borongan_pcs=user_data.tarif_borongan_pcs,
        
        total_hadir=0, total_terlambat=0, total_izin=0, total_alpa=0, poin_pelanggaran=0
    )
    
    db.add(karyawan_baru)
    db.commit()
    db.refresh(karyawan_baru)
    return {"message": f"Karyawan {user_data.nama} ({final_id}) sukses didaftarkan!"}


# 🟢 2. Login Utama
@router.post("/login")
async def login(credentials: LoginInput, db: Session = Depends(get_db)):
    user = db.query(models.Karyawan).filter(models.Karyawan.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kombinasi Username atau Password salah!")
    
    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id_karyawan": user.id_karyawan,
            "nama": user.nama,
            "username": user.username,
            "role": user.role,
            "poin_pelanggaran": user.poin_pelanggaran
        }
    }


# 🔏 3. Verifikasi PIN Gate (Mendukung Dev Mode Bypass)
@router.post("/verify-pin")
async def verify_security_pin(
    payload: PinVerifyInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Memverifikasi PIN Personal atau Universal PIN Developer."""
    user_role = getattr(current_user, "role", "").upper()
    dev_mode = os.getenv("DEV_MODE", "true").lower() == "true"
    
    # ⚡ 1. Universal PIN '6767' Khusus DEVELOPER dalam Dev Mode
    if payload.pin == "6767" and user_role == "DEVELOPER" and dev_mode:
        return {"success": True, "message": "Otorisasi Universal PIN Developer berhasil!"}

    # 🔒 2. Backup PIN Master '9999' / User Personal PIN Check
    PIN_MASTER = "9999"
    user_pin = getattr(current_user, "pin", "1234") or "1234"
    
    if payload.pin != user_pin and payload.pin != PIN_MASTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="PIN Access Gate yang Anda masukkan salah!"
        )
        
    return {"success": True, "message": "Otorisasi PIN berhasil!"}


# 🔑 4. Ganti PIN Gate Personal
@router.post("/change-pin")
async def change_pin(
    payload: ChangePinInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Mengubah PIN Access Gate milik user yang sedang login."""
    user_pin = getattr(current_user, "pin", "1234") or "1234"
    
    # Validasi PIN lama
    if payload.old_pin != user_pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="PIN Lama yang Anda masukkan salah!"
        )
    
    # Validasi format PIN baru (4-6 digit angka)
    if not payload.new_pin.isdigit() or not (4 <= len(payload.new_pin) <= 6):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="PIN Baru harus berupa 4 hingga 6 digit angka!"
        )

    # Simpan ke Database
    current_user.pin = payload.new_pin
    db.commit()
    
    return {"success": True, "message": "PIN Access Gate berhasil diperbarui!"}