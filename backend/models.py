import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ===========================================================================
# ENUMERATIONS (PRODUKSI BORONGAN)
# ===========================================================================
class StatusSPK(str, enum.Enum):
    DRAFT = "DRAFT"
    ON_PROGRESS = "ON_PROGRESS"
    FINISHED = "FINISHED"
    ARCHIVED = "ARCHIVED"

class TahapanProses(str, enum.Enum):
    CUTTING = "CUTTING"
    PERSIAPAN_PRESS = "PERSIAPAN_PRESS"
    SEWING = "SEWING"
    BUANG_BENANG = "BUANG_BENANG"
    FINISHING_PRESS = "FINISHING_PRESS"
    PACKING = "PACKING"

class StatusVerifikasiOutput(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ===========================================================================
# 1. CORE & SECURITY MODELS
# ===========================================================================
class SystemSecurity(Base):
    __tablename__ = "system_security"

    id = Column(Integer, primary_key=True, index=True, default=1)
    master_pin_hash = Column(String(255), nullable=False) # Master System PIN (Owner/Dev)
    pin_qc_hash = Column(String(255), nullable=True)      # 👈 PIN Khusus Modul Produksi & QC
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


# ===========================================================================
# 2. KARYAWAN & DISIPLIN MODELS
# ===========================================================================
class Karyawan(Base):
    __tablename__ = "karyawan"

    id_karyawan = Column(String, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    pin = Column(String(10), default="123456")  # Security PIN 6-Digit khusus otorisasi
    role = Column(String, default="PRODUKSI")   # PRODUKSI, ADMIN, FINANCE, GUDANG, OWNER, DEVELOPER
    is_active = Column(Boolean, default=True)   # Status Aktif Bekerja
    
    # BIODATA & DETAIL PEKERJAAN
    jabatan = Column(String, default="Operator Produksi")  # Operator Sewing, Potong, QC, Mekanik, dll.
    tanggal_lahir = Column(String, nullable=True)          # YYYY-MM-DD
    no_hp = Column(String, nullable=True)
    alamat = Column(String, nullable=True)
    status_karyawan = Column(String, default="KONTRAK")    # TETAP, KONTRAK, HARIAN_LEPAS
    tanggal_masuk = Column(String, nullable=True)          # YYYY-MM-DD

    # SKEMA PENGGAJIAN
    tipe_pay = Column(String, default="BORONGAN")   # BORONGAN / HARIAN / BULANAN
    gaji_pokok = Column(Integer, default=0)         # Untuk Harian/Bulanan
    tarif_borongan_pcs = Column(Integer, default=0) # Untuk Borongan Standard
    
    # REKAP KEDISIPLINAN
    total_hadir = Column(Integer, default=0)
    total_terlambat = Column(Integer, default=0)
    total_izin = Column(Integer, default=0)
    total_alpa = Column(Integer, default=0)
    poin_pelanggaran = Column(Integer, default=0)

    # Relasi
    pelanggaran = relationship("LogPelanggaran", back_populates="karyawan", cascade="all, delete-orphan")
    output_borongan = relationship("LogOutputBorongan", back_populates="karyawan")


class LogPelanggaran(Base):
    __tablename__ = "log_pelanggaran"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_karyawan = Column(String, ForeignKey("karyawan.id_karyawan", ondelete="CASCADE"), nullable=False)
    jenis = Column(String, nullable=False)
    poin = Column(Integer, nullable=False)
    keterangan = Column(String, nullable=False)
    tanggal = Column(String, nullable=False)

    karyawan = relationship("Karyawan", back_populates="pelanggaran")


# ===========================================================================
# 3. MESIN MODELS
# ===========================================================================
class Mesin(Base):
    __tablename__ = "mesin"

    id = Column(Integer, primary_key=True, index=True)
    kode_mesin = Column(String(50), unique=True, index=True, nullable=False)
    nama_mesin = Column(String(100), nullable=False)
    kategori = Column(String(50), nullable=False)    # JAHIT, OBRAS, CUTTING, PRESS, EMBROIDERY
    merk_tipe = Column(String(100), nullable=True)
    lokasi_line = Column(String(50), nullable=False) # Line 1, Line 2, Cutting Room, Finishing
    status = Column(String(30), default="OPERASIONAL") # OPERASIONAL, MAINTENANCE, RUSAK
    
    operator_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    
    keterangan = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    operator = relationship("Karyawan", foreign_keys=[operator_id])


# ===========================================================================
# 4. BAHAN BAKU & INVENTARIS GARMENT MODELS
# ===========================================================================
class BahanBaku(Base):
    __tablename__ = "bahan_baku"

    id = Column(String(50), primary_key=True, index=True)
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
    
    no_faktur_po = Column(String(100), default="-")
    tanggal_masuk = Column(String(20), nullable=True)
    tipe_pembayaran = Column(String(30), default="CASH")
    status_pembayaran = Column(String(30), default="LUNAS")
    jatuh_tempo = Column(String(20), nullable=True)
    
    terakhir_diperbarui = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mutasi_logs = relationship("LogMutasiBahan", back_populates="bahan", cascade="all, delete-orphan")


class LogMutasiBahan(Base):
    __tablename__ = "log_mutasi_bahan"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bahan_id = Column(String(50), ForeignKey("bahan_baku.id", ondelete="CASCADE"), nullable=False)
    tanggal = Column(DateTime, default=datetime.utcnow)
    tipe = Column(String(30), nullable=False)  # MASUK, KELUAR_PRODUKSI, PENYESUAIAN, RETUR
    jumlah = Column(Float, nullable=False)
    stok_sebelum = Column(Float, nullable=False)
    stok_sesudah = Column(Float, nullable=False)
    referensi_po_spk = Column(String(100), default="-")
    catatan = Column(String(255), nullable=True)
    petugas = Column(String(100), default="Admin Gudang")

    bahan = relationship("BahanBaku", back_populates="mutasi_logs")


# ===========================================================================
# 5. PRODUKSI BORONGAN MODELS (UPGRADED COMPREHENSIVE)
# ===========================================================================
class SPKProduksi(Base):
    __tablename__ = "spk_produksi"

    id = Column(String(50), primary_key=True, index=True)  # Kode SPK e.g. SPK-2026-07-001
    
    # A. Informational Pemesan & Kontrak Buyer
    nama_pemesan = Column(String(150), nullable=True)
    kontak_pemesan = Column(String(50), nullable=True)    # No WA / Telepon Client
    no_po_buyer = Column(String(100), nullable=True)       # Nomor PO resmi buyer
    alamat_pengiriman = Column(Text, nullable=True)

    # B. Identitas Artikel & Media
    nama_artikel = Column(String(150), nullable=False, index=True)  # e.g. Kemeja Valmont CVC
    kategori_produk = Column(String(50), default="Kemeja")         # Kemeja, Kaos, Jaket, Celana, dll.
    prioritas = Column(String(20), default="NORMAL")              # NORMAL, HIGH, URGENT
    deskripsi = Column(Text, nullable=True)
    foto_sampel = Column(String(500), nullable=True)              # File Path / URL Foto Mockup Baju

    # C. Size Breakdown Matrix (JSON: {"S": 100, "M": 200, "L": 200, "XL": 100})
    size_matrix = Column(JSON, nullable=True, default={})
    target_qty = Column(Integer, nullable=False, default=0)         # Auto-calculated Total Qty Size
    realisasi_potong = Column(Integer, nullable=False, default=0)  # Qty riil dari Cutting (Hard-Cap)

    # D. Spesifikasi Bahan & Material
    jenis_kain = Column(String(150), nullable=True)     # e.g. American Drill Unione #328
    warna_kain = Column(String(100), nullable=True)
    aksesoris = Column(Text, nullable=True)             # Kancing, Resleting, Label Brand
    spesifikasi_sablon_bordir = Column(Text, nullable=True)
    toleransi_defect_pct = Column(Float, default=2.0)  # Max defect toleransi (%)

    # E. Schedule & Lifecycle Status
    tanggal_mulai = Column(Date, nullable=False)
    target_cutting = Column(Date, nullable=True)
    target_sewing = Column(Date, nullable=True)
    deadline = Column(Date, nullable=False)             # Deadline delivery final
    status = Column(String(30), default=StatusSPK.DRAFT.value, nullable=False)

    # F. Financial Valuation
    harga_jual_per_pcs = Column(Float, default=0.0)    # Untuk perhitungan estimasi omset/margin

    # G. Soft Delete & Audit Trail
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(100), nullable=True)

    # Relasi
    tarif_list = relationship("MasterTarifBorongan", back_populates="spk", cascade="all, delete-orphan")
    output_logs = relationship("LogOutputBorongan", back_populates="spk", cascade="all, delete-orphan")


class MasterTarifBorongan(Base):
    __tablename__ = "master_tarif_borongan"

    id = Column(Integer, primary_key=True, autoincrement=True)
    spk_id = Column(String(50), ForeignKey("spk_produksi.id", ondelete="CASCADE"), nullable=False)
    tahapan_proses = Column(String(50), nullable=False)  # CUTTING, BUANG_BENANG, SEWING, dll.
    tarif_per_pcs = Column(Float, nullable=False, default=0.0)
    keterangan = Column(String(255), nullable=True)

    spk = relationship("SPKProduksi", back_populates="tarif_list")


class LogOutputBorongan(Base):
    __tablename__ = "log_output_borongan"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tanggal = Column(Date, nullable=False, index=True)
    
    karyawan_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=False)
    spk_id = Column(String(50), ForeignKey("spk_produksi.id", ondelete="CASCADE"), nullable=False)
    
    tahapan_proses = Column(String(50), nullable=False)
    nomor_tiket = Column(String(100), nullable=True)     # 🟢 Standar Pabrik: Nomor Tiket Bundle / Lot Fisik
    
    qty_disetor = Column(Integer, nullable=False, default=0)
    qty_pass = Column(Integer, nullable=False, default=0)       # Lolos QC (Dasar Hitung Gaji)
    qty_rework = Column(Integer, nullable=False, default=0)     # 🟢 Cacat tapi bisa diperbaiki (masuk line rework)
    qty_scrap = Column(Integer, nullable=False, default=0)      # 🟢 Cacat permanen / BS (Bahan Sisa / Buang)
    qty_reject = Column(Integer, nullable=False, default=0)     # Total Defect (Rework + Scrap)
    
    tarif_per_pcs = Column(Float, nullable=False, default=0.0) # Snapshot tarif borongan
    subtotal_rp = Column(Float, nullable=False, default=0.0)   # qty_pass * tarif_per_pcs
    
    status_verifikasi = Column(String(30), default=StatusVerifikasiOutput.PENDING.value)
    catatan = Column(String(255), nullable=True)
    
    petugas_input = Column(String(100), nullable=False)
    verifier_id = Column(String(100), nullable=True)

    # Dokumen Bukti Physical (Media Evidence)
    foto_bukti_setoran = Column(String(500), nullable=True)  # URL foto tumpukan/ikat kain setoran
    foto_bukti_defect = Column(String(500), nullable=True)   # URL foto bukti bagian cacat/sobek dari QC

    # Jembatan Ke Modul Payroll / Penggajian
    is_paid = Column(Boolean, default=False)                    # True jika sudah masuk slip & dibayar
    payroll_id = Column(String(100), nullable=True)             # ID Slip / Periode Gaji
    paid_at = Column(DateTime, nullable=True)

    # Relasi Mesin & Inventaris Terintegrasi
    kode_mesin = Column(String(50), ForeignKey("mesin.kode_mesin"), nullable=True)
    bahan_id = Column(String(50), ForeignKey("bahan_baku.id"), nullable=True)
    jumlah_bahan_digunakan = Column(Float, nullable=True, default=0.0)

    # Soft Delete Audit Trail (Diperlukan untuk penghapusan ber-PIN)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(100), nullable=True)
    alasan_hapus = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi
    spk = relationship("SPKProduksi", back_populates="output_logs")
    karyawan = relationship("Karyawan", back_populates="output_borongan")
    mesin = relationship("Mesin", foreign_keys=[kode_mesin])
    bahan = relationship("BahanBaku", foreign_keys=[bahan_id])


# ===========================================================================
# 6. AUDIT LOG REVISI QC & PAYROLL MODELS
# ===========================================================================
class LogAuditVerifikasiQC(Base):
    """
    Mencatat jejak audit (Audit Trail) setiap kali terjadi revisi/koreksi status QC.
    Mencegah penyalahgunaan otorisasi PIN supervisor/mandor.
    """
    __tablename__ = "log_audit_verifikasi_qc"

    id = Column(Integer, primary_key=True, autoincrement=True)
    log_output_id = Column(Integer, ForeignKey("log_output_borongan.id", ondelete="CASCADE"), nullable=False)
    
    status_lama = Column(String(30), nullable=False)  # PENDING / APPROVED / REJECTED
    status_baru = Column(String(30), nullable=False)  # APPROVED / REJECTED
    
    alasan_revisi = Column(Text, nullable=False)      # Alasan wajib diisi saat koreksi
    dieksekusi_oleh = Column(String(100), nullable=False) # Username Supervisor / Mandor
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi
    output_log = relationship("LogOutputBorongan")


class LogPayrollProduksi(Base):
    """
    Mencatat riwayat transaksi pencairan gaji borongan (Pencairan Payroll)
    Tersambung dengan fungsi `markPayrollPaid` di frontend.
    """
    __tablename__ = "log_payroll_produksi"

    id = Column(String(100), primary_key=True, index=True) # e.g. PAY-202608-001
    tanggal_cair = Column(DateTime, default=datetime.utcnow)
    
    karyawan_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=False)
    total_setoran_approved = Column(Integer, default=0)
    total_pcs_pass = Column(Integer, default=0)
    total_nominal_rp = Column(Float, nullable=False, default=0.0)
    
    metode_bayar = Column(String(50), default="TRANSFER") # CASH / TRANSFER
    keterangan = Column(String(255), nullable=True)
    disetujui_oleh = Column(String(100), nullable=False) # Owner / Finance ID

    # Relasi
    karyawan = relationship("Karyawan")


# ===========================================================================
# 7. ENTERPRISE AUDIT TRAIL & LOGIN SECURITY GUARD
# ===========================================================================
class LogAudit(Base):
    """
    Mencatat setiap aksi destruktif atau sensitif (DELETE, RE-OPEN, FORCE-FINISH, CHANGE-PRICE).
    """
    __tablename__ = "log_audit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_id = Column(String(50), nullable=False)  # ID Karyawan / Username yang bertindak
    aksi = Column(String(100), nullable=False)     # Contoh: "DELETE_SPK", "FORCE_FINISH_SPK", "REOPEN_QC"
    target_id = Column(String(100), nullable=True) # ID Objek yang dikenai aksi (SPK ID, Log ID, dll)
    catatan = Column(Text, nullable=True)          # Alasan / Keterangan tambahan


class LogLogin(Base):
    """
    Mencatat riwayat percobaan login ke sistem, mendeteksi dan merekam upaya login di luar jam kerja.
    """
    __tablename__ = "log_login"

    id = Column(Integer, primary_key=True, autoincrement=True)
    karyawan_id = Column(String(50), nullable=True)
    username = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), nullable=False)    # "SUCCESS", "BLOCKED_OFF_HOURS", "FAILED_PASSWORD"
    ip_address = Column(String(50), nullable=True)
    keterangan = Column(String(255), nullable=True)