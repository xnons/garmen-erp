from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime


class SystemSecurity(Base):
    __tablename__ = "system_security"

    id = Column(Integer, primary_key=True, index=True, default=1)
    master_pin_hash = Column(String(255), nullable=False)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class Karyawan(Base):
    __tablename__ = "karyawan"

    id_karyawan = Column(String, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    pin = Column(String, default="1234")
    role = Column(String, default="PRODUKSI")  # PRODUKSI, ADMIN, FINANCE, GUDANG, OWNER
    is_active = Column(Boolean, default=True)  # Status Aktif Bekerja
    
    # 🟢 BIODATA & DETAIL PEKERJAAN
    jabatan = Column(String, default="Operator Produksi") # Operator Sewing, Operator Potong, QC, Mekanik, dll.
    tanggal_lahir = Column(String, nullable=True)         # YYYY-MM-DD (Menggantikan umur)
    no_hp = Column(String, nullable=True)
    alamat = Column(String, nullable=True)
    status_karyawan = Column(String, default="KONTRAK") # TETAP, KONTRAK, HARIAN_LEPAS
    tanggal_masuk = Column(String, nullable=True)       # YYYY-MM-DD atau DD-MM-YYYY

    # 🟢 SKEMA PENGGAJIAN
    tipe_pay = Column(String, default="BORONGAN")  # BORONGAN / HARIAN / BULANAN
    gaji_pokok = Column(Integer, default=0)         # Untuk Harian/Bulanan
    tarif_borongan_pcs = Column(Integer, default=0) # Untuk Borongan
    
    # 🟢 REKAP KEDISIPLINAN
    total_hadir = Column(Integer, default=0)
    total_terlambat = Column(Integer, default=0)
    total_izin = Column(Integer, default=0)
    total_alpa = Column(Integer, default=0)
    poin_pelanggaran = Column(Integer, default=0)

    # Relasi ke Log Pelanggaran
    pelanggaran = relationship("LogPelanggaran", back_populates="karyawan", cascade="all, delete-orphan")


class LogPelanggaran(Base):
    __tablename__ = "log_pelanggaran"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_karyawan = Column(String, ForeignKey("karyawan.id_karyawan", ondelete="CASCADE"), nullable=False)
    jenis = Column(String, nullable=False)
    poin = Column(Integer, nullable=False)
    keterangan = Column(String, nullable=False)
    tanggal = Column(String, nullable=False)

    karyawan = relationship("Karyawan", back_populates="pelanggaran")

class Mesin(Base):
    __tablename__ = "mesin"

    id = Column(Integer, primary_key=True, index=True)
    kode_mesin = Column(String(50), unique=True, index=True, nullable=False)  # Contoh: MSN-JHT-001
    nama_mesin = Column(String(100), nullable=False)                         # Contoh: Mesin Jahit High Speed
    kategori = Column(String(50), nullable=False)                             # JAHIT, OBRAS, CUTTING, PRESS, EMBROIDERY
    merk_tipe = Column(String(100), nullable=True)                            # Contoh: Juki DDL-8700
    lokasi_line = Column(String(50), nullable=False)                          # Line 1, Line 2, Cutting Room, Finishing
    status = Column(String(30), default="OPERASIONAL")                        # OPERASIONAL, MAINTENANCE, RUSAK
    
    # Penanggung Jawab / Operator Mesin (Opsional)
    operator_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    
    keterangan = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    operator = relationship("Karyawan", foreign_keys=[operator_id])