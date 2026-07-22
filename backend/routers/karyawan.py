from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
from schemas.karyawan import PelanggaranInput, UpdatePinInput, UpdateKaryawanInput
from core.security import get_current_user_role, get_current_user

router = APIRouter(prefix="/api", tags=["Karyawan & Pelanggaran"])


# 1️⃣ GET ALL KARYAWAN (DENGAN DATA TANGGAL LAHIR & SKEMA GAJI)
@router.get("/karyawan")
@router.get("/karyawan/")
async def get_all_karyawan(
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Akses ditolak! Menu Kelola Karyawan hanya untuk Admin atau Owner."
        )
        
    daftar_pekerja = db.query(models.Karyawan).all()
    return [
        {
            "id_karyawan": p.id_karyawan,
            "nama": p.nama,
            "username": p.username,
            "role": p.role,
            "jabatan": p.jabatan,
            "tanggal_lahir": p.tanggal_lahir,  # 👈 Menggantikan umur
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


# 2️⃣ TAMBAH SANKSI PELANGGARAN -> POST /api/karyawan/{id_karyawan}/pelanggaran
@router.post("/karyawan/{id_karyawan}/pelanggaran")
async def tambah_pelanggaran_karyawan(
    id_karyawan: str,
    input_data: PelanggaranInput,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Akses ditolak! Hanya Admin atau Owner.")
        
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


# 3️⃣ AMBIL RIWAYAT LOG PELANGGARAN -> GET /api/karyawan/{id_karyawan}/pelanggaran
@router.get("/karyawan/{id_karyawan}/pelanggaran")
async def ambil_riwayat_pelanggaran(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")
        
    logs = db.query(models.LogPelanggaran).filter(models.LogPelanggaran.id_karyawan == id_karyawan).all()
    
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


# 4️⃣ RESET SELURUH POIN SANKSI KARYAWAN KE 0 -> PUT /api/karyawan/{id_karyawan}/reset-sanksi
@router.put("/karyawan/{id_karyawan}/reset-sanksi")
async def reset_sanksi_karyawan(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Akses ditolak! Hanya Admin atau Owner.")

    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")

    karyawan.poin_pelanggaran = 0
    db.commit()

    return {"message": f"Seluruh poin sanksi untuk {karyawan.nama} ({id_karyawan}) berhasil dibersihkan menjadi 0!"}


# 5️⃣ PEMUTIHAN / CABUT SATUAN LOG SANKSI -> DELETE /api/pelanggaran/{id_log}
@router.delete("/pelanggaran/{id_log}")
async def hapus_pelanggaran(
    id_log: int,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role != "OWNER":
        raise HTTPException(status_code=403, detail="Akses ditolak! Hanya Owner yang bisa mencabut sanksi spesifik.")
        
    log = db.query(models.LogPelanggaran).filter(models.LogPelanggaran.id == id_log).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log sanksi tidak ditemukan.")
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == log.id_karyawan).first()
    if karyawan:
        karyawan.poin_pelanggaran = max(0, (karyawan.poin_pelanggaran or 0) - log.poin)
        
    db.delete(log)
    db.commit()
    
    return {"message": "Log sanksi berhasil dicabut."}


# 6️⃣ EDIT BIODATA & GAJI KARYAWAN -> PUT /api/karyawan/{id_karyawan}
@router.put("/karyawan/{id_karyawan}")
async def edit_data_karyawan(
    id_karyawan: str,
    input_data: UpdateKaryawanInput,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Akses ditolak! Hanya Admin atau Owner.")
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")
        
    # Update field dinamis jika dikirim oleh frontend
    for field, value in input_data.model_dump(exclude_unset=True).items():
        setattr(karyawan, field, value)
        
    db.commit()
    return {"message": f"Data karyawan {karyawan.nama} ({id_karyawan}) berhasil diperbarui!"}


# 7️⃣ RESET PIN KARYAWAN -> PUT /api/karyawan/{id_karyawan}/reset-pin
@router.put("/karyawan/{id_karyawan}/reset-pin")
async def reset_pin_karyawan(
    id_karyawan: str,
    input_data: UpdatePinInput,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Akses ditolak! Hanya Admin atau Owner."
        )
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")
        
    karyawan.pin = input_data.pin
    db.commit()
    
    return {"message": f"PIN Security Gate untuk {karyawan.nama} ({id_karyawan}) berhasil diperbarui!"}


# 8️⃣ HAPUS KARYAWAN -> DELETE /api/karyawan/{id_karyawan}
@router.delete("/karyawan/{id_karyawan}")
async def hapus_karyawan(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya Admin atau Owner."
        )
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")
        
    db.delete(karyawan)
    db.commit()
    
    return {"message": f"Karyawan {karyawan.nama} ({id_karyawan}) berhasil dihapus."}