from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
from schemas.karyawan import (
    KaryawanCreate,  # Pastikan schema ini ada di schemas/karyawan.py
    PelanggaranInput, 
    UpdatePinInput, 
    UpdateKaryawanInput
)
from core.security import get_current_user, get_password_hash
from core.audit_helper import record_audit

router = APIRouter(prefix="/api", tags=["Karyawan & Pelanggaran"])


# ---------------------------------------------------------------------------
# 0️⃣ TAMBAH KARYAWAN BARU -> POST /api/karyawan
# ---------------------------------------------------------------------------
@router.post("/karyawan")
@router.post("/karyawan/")
async def create_karyawan(
    input_data: KaryawanCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    # 🔒 Akses awal: Hanya ADMIN, OWNER, dan DEVELOPER
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Anda tidak memiliki wewenang menambah karyawan."
        )

    target_role = input_data.role.upper()

    # 🔒 PROTEKSI UTAMA: Role OWNER & DEVELOPER HANYA bisa dibuat oleh DEVELOPER
    if target_role in ["OWNER", "DEVELOPER"] and current_user.role != "DEVELOPER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Akses Ditolak! Admin atau Owner tidak diperbolehkan mendaftarkan akun ber-role '{target_role}'. Fitur ini khusus DEVELOPER."
        )

    # Cek duplikasi Username / ID Karyawan
    existing_user = db.query(models.Karyawan).filter(
        (models.Karyawan.username == input_data.username) | 
        (models.Karyawan.id_karyawan == input_data.id_karyawan)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username atau ID Karyawan sudah terdaftar di sistem!"
        )

    # Hash password baru
    data_dict = input_data.model_dump()
    raw_password = data_dict.pop("password")
    hashed_pwd = get_password_hash(raw_password)

    new_karyawan = models.Karyawan(
        **data_dict,
        hashed_password=hashed_pwd
    )
    db.add(new_karyawan)
    db.commit()
    db.refresh(new_karyawan)

    return {"message": f"Karyawan {new_karyawan.nama} ({new_karyawan.role}) berhasil ditambahkan!"}


# ---------------------------------------------------------------------------
# 1️⃣ GET ALL KARYAWAN -> GET /api/karyawan
# ---------------------------------------------------------------------------
@router.get("/karyawan")
@router.get("/karyawan/")
async def get_all_karyawan(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Akses ditolak! Menu Kelola Karyawan hanya untuk Admin, Owner, atau Developer."
        )
        
    daftar_pekerja = db.query(models.Karyawan).all()
    return [
        {
            "id_karyawan": p.id_karyawan,
            "nama": p.nama,
            "username": p.username,
            "role": p.role,
            "jabatan": p.jabatan,
            "tanggal_lahir": p.tanggal_lahir,
            "no_hp": p.no_hp,
            "alamat": p.alamat,
            "status_karyawan": p.status_karyawan,
            "tanggal_masuk": p.tanggal_masuk,
            "is_active": p.is_active,
            "tipe_pay": p.tipe_pay,
            "gaji_pokok": p.gaji_pokok,
            "tarif_borongan_pcs": p.tarif_borongan_pcs,
            "poin_pelanggaran": p.poin_pelanggaran
        }
        for p in daftar_pekerja
    ]


# ---------------------------------------------------------------------------
# 2️⃣ TAMBAH SANKSI PELANGGARAN -> POST /api/karyawan/{id_karyawan}/pelanggaran
# ---------------------------------------------------------------------------
@router.post("/karyawan/{id_karyawan}/pelanggaran")
async def tambah_pelanggaran_karyawan(
    id_karyawan: str,
    input_data: PelanggaranInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")
        
    log_baru = models.LogPelanggaran(
        id_karyawan=id_karyawan,
        jenis=input_data.jenis,
        poin=input_data.poin,
        keterangan=input_data.keterangan,
        tanggal=datetime.now().strftime("%d-%m-%Y")
    )
    db.add(log_baru)
    karyawan.poin_pelanggaran = (karyawan.poin_pelanggaran or 0) + input_data.poin
    db.commit()
    
    return {"message": f"Berhasil mencatat sanksi +{input_data.poin} poin ke {karyawan.nama}."}


# ---------------------------------------------------------------------------
# 3️⃣ AMBIL RIWAYAT LOG PELANGGARAN -> GET /api/karyawan/{id_karyawan}/pelanggaran
# ---------------------------------------------------------------------------
@router.get("/karyawan/me/pelanggaran")
async def ambil_riwayat_pelanggaran_saya(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Mengambil riwayat sanksi/kedisiplinan akun user yang sedang login."""
    logs = db.query(models.LogPelanggaran).filter(
        models.LogPelanggaran.id_karyawan == current_user.id_karyawan
    ).order_by(models.LogPelanggaran.id.desc()).all()
    
    return [
        {
            "id": log.id,
            "id_karyawan": log.id_karyawan,
            "jenis": log.jenis,
            "poin": log.poin,
            "keterangan": log.keterangan,
            "tanggal": log.tanggal
        }
        for log in logs
    ]


@router.get("/karyawan/{id_karyawan}/pelanggaran")
async def ambil_riwayat_pelanggaran(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")
        
    logs = db.query(models.LogPelanggaran).filter(models.LogPelanggaran.id_karyawan == id_karyawan).order_by(models.LogPelanggaran.id.desc()).all()
    
    return [
        {
            "id": log.id,
            "id_karyawan": log.id_karyawan,
            "jenis": log.jenis,
            "poin": log.poin,
            "keterangan": log.keterangan,
            "tanggal": log.tanggal
        }
        for log in logs
    ]


# ---------------------------------------------------------------------------
# 4️⃣ RESET SELURUH POIN SANKSI KARYAWAN KE 0 -> PUT /api/karyawan/{id_karyawan}/reset-sanksi
# ---------------------------------------------------------------------------
@router.put("/karyawan/{id_karyawan}/reset-sanksi")
async def reset_sanksi_karyawan(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")

    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")

    karyawan.poin_pelanggaran = 0
    db.commit()

    return {"message": f"Seluruh poin sanksi untuk {karyawan.nama} ({id_karyawan}) berhasil dibersihkan menjadi 0!"}


# ---------------------------------------------------------------------------
# 5️⃣ PEMUTIHAN / CABUT SATUAN LOG SANKSI -> DELETE /api/pelanggaran/{id_log}
# ---------------------------------------------------------------------------
@router.delete("/pelanggaran/{id_log}")
async def hapus_pelanggaran(
    id_log: int,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak! Hanya Owner/Developer yang bisa mencabut sanksi spesifik.")
        
    log = db.query(models.LogPelanggaran).filter(models.LogPelanggaran.id == id_log).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log sanksi tidak ditemukan.")
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == log.id_karyawan).first()
    if karyawan:
        karyawan.poin_pelanggaran = max(0, (karyawan.poin_pelanggaran or 0) - log.poin)
        
    db.delete(log)
    db.commit()
    
    return {"message": "Log sanksi berhasil dicabut."}


# ---------------------------------------------------------------------------
# 6️⃣ EDIT BIODATA & GAJI KARYAWAN -> PUT /api/karyawan/{id_karyawan}
# ---------------------------------------------------------------------------
@router.put("/karyawan/{id_karyawan}")
async def edit_data_karyawan(
    id_karyawan: str,
    input_data: UpdateKaryawanInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")
        
    target_karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not target_karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")

    # 🔒 PROTEKSI UTAMA: Admin tidak boleh mengedit data akun OWNER atau DEVELOPER
    if target_karyawan.role in ["OWNER", "DEVELOPER"] and current_user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses Ditolak! Admin tidak diizinkan mengubah data akun Owner atau Developer."
        )

    # 🔒 PROTEKSI UTAMA: Admin tidak boleh menaikkan role siapapun menjadi OWNER/DEVELOPER
    update_data = input_data.model_dump(exclude_unset=True)
    if "role" in update_data:
        new_role = update_data["role"].upper()
        if new_role in ["OWNER", "DEVELOPER"] and current_user.role != "DEVELOPER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses Ditolak! Hanya DEVELOPER yang bisa mengubah role karyawan menjadi '{new_role}'."
            )

    # 🔒 Handle Reset Password oleh Atasan (Owner / Developer / Admin)
    if "password" in update_data and update_data["password"]:
        raw_pwd = update_data.pop("password")
        target_karyawan.hashed_password = get_password_hash(raw_pwd)
        
        actor_name = getattr(current_user, "nama", None) or current_user.id_karyawan
        record_audit(
            db=db,
            actor_id=current_user.id_karyawan,
            aksi="RESET_PASSWORD_KARYAWAN",
            target_id=id_karyawan,
            catatan=f"Password akun {target_karyawan.nama} ({id_karyawan}) direset oleh atasan {actor_name}."
        )
        
    for field, value in update_data.items():
        setattr(target_karyawan, field, value)
        
    db.commit()
    return {"message": f"Data karyawan {target_karyawan.nama} ({id_karyawan}) berhasil diperbarui!"}


# ---------------------------------------------------------------------------
# 7️⃣ RESET PIN KARYAWAN -> PUT /api/karyawan/{id_karyawan}/reset-pin
# ---------------------------------------------------------------------------
@router.put("/karyawan/{id_karyawan}/reset-pin")
async def reset_pin_karyawan(
    id_karyawan: str,
    input_data: UpdatePinInput,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")
        
    target_karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not target_karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")

    # 🔒 PROTEKSI: Admin tidak boleh mereset PIN milik Owner/Developer
    if target_karyawan.role in ["OWNER", "DEVELOPER"] and current_user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses Ditolak! Admin tidak diperbolehkan mereset PIN milik Owner atau Developer."
        )
        
    target_karyawan.pin = input_data.pin
    db.commit()
    
    return {"message": f"PIN Security Gate untuk {target_karyawan.nama} ({id_karyawan}) berhasil diperbarui!"}


# ---------------------------------------------------------------------------
# 8️⃣ HAPUS KARYAWAN -> DELETE /api/karyawan/{id_karyawan}
# ---------------------------------------------------------------------------
@router.delete("/karyawan/{id_karyawan}")
async def hapus_karyawan(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role not in ["OWNER", "ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")
        
    target_karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not target_karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")

    # 🔒 PROTEKSI: Admin/Owner tidak boleh menghapus akun Owner lain/Developer
    if target_karyawan.role in ["OWNER", "DEVELOPER"] and current_user.role != "DEVELOPER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses Ditolak! Hanya DEVELOPER yang berhak menghapus akun Owner atau Developer."
        )
        
    db.delete(target_karyawan)
    db.commit()
    
    return {"message": f"Karyawan {target_karyawan.nama} ({id_karyawan}) berhasil dihapus."}