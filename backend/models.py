from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


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
    jabatan = Column(String, default="Operator Produksi") # Operator Sewing, Potong, QC, Mekanik, dll.
    tanggal_lahir = Column(String, nullable=True)         # YYYY-MM-DD
    no_hp = Column(String, nullable=True)
    alamat = Column(String, nullable=True)
    status_karyawan = Column(String, default="KONTRAK")   # TETAP, KONTRAK, HARIAN_LEPAS
    tanggal_masuk = Column(String, nullable=True)         # YYYY-MM-DD

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
    
    operator_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    
    keterangan = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    operator = relationship("Karyawan", foreign_keys=[operator_id])


# 🟢 MODEL BAHAN BAKU & INVENTARIS GARMENT
class BahanBaku(Base):
    __tablename__ = "bahan_baku"

    id = Column(String(50), primary_key=True, index=True) # Menggunakan kode_sku sebagai Primary Key ID
    kode_sku = Column(String(50), unique=True, index=True, nullable=False)
    nama_item = Column(String(150), nullable=False)
    kategori = Column(String(50), nullable=False)
    satuan = Column(String(20), nullable=False)
    stok_saat_ini = Column(Float, default=0.0)
    stok_minimum = Column(Float, default=10.0)
    harga_per_satuan = Column(Float, default=0.0)
    lokasi_gudang = Column(String(100), nullable=False)
    supplier_utama = Column(String(100), default="-")
    warna_kode = Column(String(20), default="#3b82f6")
    
    # Dokumen, Faktur & Transaksi Pembelian
    no_faktur_po = Column(String(100), default="-")
    tanggal_masuk = Column(String(20), nullable=True)
    tipe_pembayaran = Column(String(30), default="CASH")
    status_pembayaran = Column(String(30), default="LUNAS")
    jatuh_tempo = Column(String(20), nullable=True)
    
    terakhir_diperbarui = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi ke Log Mutasi (Otomatis terhapus jika barang dihapus)
    mutasi_logs = relationship("LogMutasiBahan", back_populates="bahan", cascade="all, delete-orphan")


# 🟢 MODEL RIWAYAT MUTASI STOK
class LogMutasiBahan(Base):
    __tablename__ = "log_mutasi_bahan"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bahan_id = Column(String(50), ForeignKey("bahan_baku.id", ondelete="CASCADE"), nullable=False)
    tanggal = Column(DateTime, default=datetime.utcnow)
    tipe = Column(String(30), nullable=False) # MASUK, KELUAR_PRODUKSI, PENYESUAIAN, RETUR
    jumlah = Column(Float, nullable=False)
    stok_sebelum = Column(Float, nullable=False)
    stok_sesudah = Column(Float, nullable=False)
    referensi_po_spk = Column(String(100), default="-")
    catatan = Column(String(255), nullable=True)
    petugas = Column(String(100), default="Admin Gudang")

    bahan = relationship("BahanBaku", back_populates="mutasi_logs")