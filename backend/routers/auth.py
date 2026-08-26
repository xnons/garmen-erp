import os
import random
import string
from datetime import timedelta, datetime, time, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
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
    pin: str = Field(..., example="1234")

class ChangePinInput(BaseModel):
    old_pin: str = Field(..., example="1234")
    new_pin: str = Field(..., min_length=4, max_length=6, example="5678")


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


# ⏰ Helper Cek Jam Kerja WIB (07:00 - 20:00 WIB)
def is_working_hours() -> bool:
    # Menggunakan timezone WIB (UTC+7) agar konsisten meskipun server cloud berjalan di UTC
    wib_tz = timezone(timedelta(hours=7))
    now_wib_time = datetime.now(wib_tz).time()
    start_work = time(7, 0)
    end_work = time(20, 0)
    return start_work <= now_wib_time <= end_work


# 📝 Helper Rekam Log Login & Security Attempt
def record_login_log(db: Session, karyawan_id: Optional[str], username: str, status_login: str, ip_address: Optional[str], ket: Optional[str] = None):
    try:
        log_entry = models.LogLogin(
            karyawan_id=karyawan_id,
            username=username,
            status=status_login,
            ip_address=ip_address,
            keterangan=ket
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Gagal mencatat log login: {e}")


# 🟢 1. Registrasi Karyawan Baru (RBAC Hardened)
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
    
    # 4️⃣ Validasi Format PIN (jika disediakan)
    raw_pin = user_data.pin or "1234"
    if not raw_pin.isdigit() or not (4 <= len(raw_pin) <= 6):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN Security Gate harus berupa 4 hingga 6 digit angka!"
        )

    final_id = user_data.id_karyawan or generate_unique_id_karyawan(db)
    hashed_password = get_password_hash(user_data.password)
    hashed_pin = get_password_hash(raw_pin)  # 🔒 Hash PIN untuk disimpan di Database
    
    karyawan_baru = models.Karyawan(
        id_karyawan=final_id,
        nama=user_data.nama,
        username=user_data.username,
        hashed_password=hashed_password,
        pin=hashed_pin,
        role=target_role,
        is_active=True,
        
        jabatan=user_data.jabatan,
        tanggal_lahir=user_data.tanggal_lahir,
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


# 🟢 2. Login Utama (Dilengkapi Login Time Guard & Audit Log)
@router.post("/login")
async def login(credentials: LoginInput, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "Unknown"
    user = db.query(models.Karyawan).filter(models.Karyawan.username == credentials.username).first()
    
    # 1️⃣ Validasi Kredensial Password
    if not user or not verify_password(credentials.password, user.hashed_password):
        record_login_log(db, user.id_karyawan if user else None, credentials.username, "FAILED_PASSWORD", client_ip, "Kombinasi Username atau Password salah")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kombinasi Username atau Password salah!")
    
    # 2️⃣ Validasi Status Aktif Akun
    if not user.is_active:
        record_login_log(db, user.id_karyawan, credentials.username, "BLOCKED_INACTIVE", client_ip, "Akun nonaktif/diarsipkan")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akun Anda dalam status nonaktif/diarsipkan.")

    # 3️⃣ 🛡️ Login Time Guard (Blokir Akses di Luar Jam Kerja, Kecuali Owner/Developer)
    user_role_upper = str(user.role or "").upper()
    if user_role_upper not in ["OWNER", "DEVELOPER"]:
        if not is_working_hours():
            record_login_log(db, user.id_karyawan, credentials.username, "BLOCKED_OFF_HOURS", client_ip, "Upaya login di luar jam operasional (07:00 - 20:00)")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Akses Ditolak: Sistem dibatasi di luar jam operasional (07:00 - 20:00). Hubungi Owner untuk pengecualian."
            )

    # 4️⃣ Sukses: Terbitkan Token JWT & Rekam Log Sukses
    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    record_login_log(db, user.id_karyawan, credentials.username, "SUCCESS", client_ip, "Login berhasil")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id_karyawan": user.id_karyawan,
            "nama": user.nama,
            "username": user.username,
            "role": user.role,
            "jabatan": user.jabatan,
            "poin_pelanggaran": user.poin_pelanggaran
        }
    }


# 👤 3. Profil Pengguna Aktif (Restore / Revalidate JWT Session)
@router.get("/me")
async def get_current_user_profile(
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Mengembalikan data pengguna yang sedang login berdasarkan token JWT."""
    return {
        "id_karyawan": current_user.id_karyawan,
        "nama": current_user.nama,
        "username": current_user.username,
        "role": current_user.role,
        "jabatan": current_user.jabatan,
        "status_karyawan": current_user.status_karyawan,
        "poin_pelanggaran": current_user.poin_pelanggaran
    }


# 🔏 4. Verifikasi PIN Gate (Mendukung Bcrypt Hash & System Security PIN)
@router.post("/verify-pin")
async def verify_security_pin(
    payload: PinVerifyInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Memverifikasi PIN Personal Karyawan atau Master PIN Sistem."""
    user_role = getattr(current_user, "role", "").upper()
    db_pin = getattr(current_user, "pin", None)
    is_pin_valid = False

    # 1. Validasi PIN Personal User
    if db_pin:
        if db_pin.startswith("$2b$") or db_pin.startswith("$2a$"):
            is_pin_valid = verify_password(payload.pin, db_pin)
        else:
            is_pin_valid = (payload.pin == db_pin)

    # 2. Jika user adalah OWNER/DEVELOPER, izinkan juga jika cocok dengan Master PIN Sistem ter-hash di DB
    if not is_pin_valid and user_role in ["OWNER", "DEVELOPER"]:
        sec = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
        if sec and sec.master_pin_hash:
            if sec.master_pin_hash.startswith("$2b$") or sec.master_pin_hash.startswith("$2a$"):
                is_pin_valid = verify_password(payload.pin, sec.master_pin_hash)
            else:
                is_pin_valid = (payload.pin == sec.master_pin_hash)

    if not is_pin_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="PIN Access Gate yang Anda masukkan salah!"
        )
        
    return {"success": True, "message": "Otorisasi PIN berhasil!"}


# 🔑 5. Ganti PIN Gate Personal
@router.post("/change-pin")
async def change_pin(
    payload: ChangePinInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Mengubah PIN Access Gate milik user yang sedang login."""
    db_pin = getattr(current_user, "pin", None)
    
    # Validasi PIN lama
    is_old_pin_correct = False
    if db_pin:
        if db_pin.startswith("$2b$") or db_pin.startswith("$2a$"):
            is_old_pin_correct = verify_password(payload.old_pin, db_pin)
        else:
            is_old_pin_correct = (payload.old_pin == db_pin)

    if not is_old_pin_correct:
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

    # Simpan PIN Ter-hash ke Database
    current_user.pin = get_password_hash(payload.new_pin)
    db.commit()
    
    return {"success": True, "message": "PIN Access Gate berhasil diperbarui!"}