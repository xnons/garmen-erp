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
    can_login = Column(Boolean, default=True)   # 👈 Hak akses login ke sistem web (False = Offline Worker)
    
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
    
    # Finansial & Pembayaran Mesin
    harga_beli = Column(Float, default=0.0)
    jumlah_terbayar = Column(Float, default=0.0)
    sisa_pembayaran = Column(Float, default=0.0)
    status_pembayaran = Column(String(30), default="LUNAS") # LUNAS, DICICIL, BELUM_BAYAR
    vendor_supplier = Column(String(100), nullable=True)
    no_seri = Column(String(100), nullable=True)
    tanggal_pembelian = Column(String(20), nullable=True)
    garansi_hingga = Column(String(20), nullable=True)
    riwayat_pembayaran = Column(JSON, nullable=True, default=[])

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
    tipe_order = Column(String(20), default="CMT")               # CMT, FOB, HYBRID
    penyedia_kain = Column(String(50), default="CUSTOMER")       # CUSTOMER, PABRIK
    penyedia_aksesoris = Column(String(50), default="CUSTOMER")  # CUSTOMER, PABRIK
    jenis_kain = Column(String(150), nullable=True)     # e.g. American Drill Unione #328
    warna_kain = Column(String(100), nullable=True)
    aksesoris = Column(Text, nullable=True)             # Kancing, Resleting, Label Brand
    spesifikasi_sablon_bordir = Column(Text, nullable=True)
    toleransi_defect_pct = Column(Float, default=2.0)  # Max defect toleransi (%)
    
    # HPP & Struktur Biaya
    biaya_kain_per_pcs = Column(Float, default=0.0)
    biaya_aksesoris_per_pcs = Column(Float, default=0.0)
    biaya_maklon_luar_per_pcs = Column(Float, default=0.0)
    konsumsi_kain_per_pcs = Column(Float, default=0.0)

    # E. Schedule & Lifecycle Status
    tanggal_mulai = Column(Date, nullable=False)
    target_cutting = Column(Date, nullable=True)
    target_sewing = Column(Date, nullable=True)
    deadline = Column(Date, nullable=False)             # Deadline delivery final
    status = Column(String(30), default=StatusSPK.DRAFT.value, nullable=False)
    dp_nominal = Column(Float, default=0.0)
    link_google_drive = Column(String(500), nullable=True)
    status_acc_sampel = Column(String(30), default="APPROVED")

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
    device_info = Column(String(255), nullable=True)  # Contoh: "💻 Windows (Chrome)" atau "📱 Android (Chrome Mobile)"
    lokasi = Column(String(255), nullable=True)       # Contoh: "Jakarta, Indonesia (Telkomsel)"
    keterangan = Column(String(255), nullable=True)


# ===========================================================================
# 8. PT. CHIKAL JAYA MAKMUR (MASTER GARMENT) ENTERPRISE BLUEPRINT MODELS
# ===========================================================================
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# 8.1 Master Data Rekanan / Partners (Buyers, Suppliers, Subcon)
class Partner(Base):
    __tablename__ = "partners"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False) # BUYER, SUPPLIER_FABRIC, MAKLUN_SEWING, SUBCON_WASHING, SUBCON_PRINT, SUBCON_EMBROIDERY
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# 8.2 Master Sales Orders (Code SO e.g. SO-MG260004)
class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. 'SO-MG260004'
    buyer_id = Column(String(50), ForeignKey("partners.id"), nullable=True)
    style_name = Column(String(150), nullable=False, index=True)           # e.g. 'WIND MILD BLACK'
    item_category = Column(String(100), default="LONG JEANS")              # 'LONG JEANS', 'SS KEMEJA', 'OUTER'
    color = Column(String(50), nullable=True)
    order_qty = Column(Integer, default=0, nullable=False)
    unit_price = Column(Float, default=0.0)
    size_breakdown_target = Column(JSON, default={})                       # {"28": 170, "30": 200, "32": 179} atau {"S": 20, "M": 50}
    bom_accessories = Column(JSON, default=[])                             # [{"item": "Kancing 24L", "qty_per_pcs": 5}]
    status = Column(String(50), default="REGISTERED")                      # REGISTERED, CUTTING, WIP_SUBCON, SEWING, WASHING, FINISHING, SHIPPED, CLOSED
    order_date = Column(Date, nullable=False, default=datetime.utcnow)
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("Partner", foreign_keys=[buyer_id])

# 8.3 Raw Material Warehouse & Fabric Inspection (4-Point ASTM)
class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    item_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. 'MG-2604-BH0001'
    description = Column(Text, nullable=False)                              # e.g. 'PURING PUTIH 01 WARNING'
    item_type = Column(String(30), nullable=False)                         # 'FABRIC_MAIN', 'PURING', 'INTERLINING', 'TRIMS_ACCESSORY'
    unit = Column(String(20), default="YARD")                              # 'YARD', 'KG', 'PCS', 'ROLL'
    unit_price = Column(Float, default=0.0)
    current_stock = Column(Float, default=0.0)
    
    # 🔍 FIELD PENGAYAAN GUDANG KAIN & TRIMS
    color_shade_lot = Column(String(50), nullable=True)                    # Lot / Batch Warna Kain
    width_inch = Column(Float, default=58.0)                               # Lebar Kain (e.g. 58", 60")
    gramasi_gsm = Column(Float, default=0.0)                               # Ketebalan Kain GSM
    min_stock_alert = Column(Float, default=50.0)                          # Batas minimum stok
    rack_location = Column(String(50), default="GUDANG_UTAMA")             # Lokasi Rak Penyimpanan (e.g. 'RAK-A1-04')

class MaterialReceipt(Base):
    __tablename__ = "material_receipts"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    item_id = Column(String(50), ForeignKey("inventory_items.id"), nullable=False)
    supplier_id = Column(String(50), ForeignKey("partners.id"), nullable=True)
    receipt_date = Column(Date, nullable=False)
    roll_number = Column(String(50), nullable=True)
    qty_received = Column(Float, nullable=False)
    unit = Column(String(20), default="YARD")
    contract_type = Column(String(20), default="FOB")                      # 'FOB' / 'CMT'
    inspection_status = Column(String(30), default="PENDING")              # 'PENDING', 'PASSED', 'REJECTED'

    item = relationship("InventoryItem", foreign_keys=[item_id])
    supplier = relationship("Partner", foreign_keys=[supplier_id])

class FabricInspection(Base):
    __tablename__ = "fabric_inspections"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    receipt_id = Column(String(50), ForeignKey("material_receipts.id"), nullable=False)
    inspector_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    inspection_date = Column(Date, nullable=False)
    lot_number = Column(String(50), nullable=True)
    length_before = Column(Float, nullable=False)
    length_after = Column(Float, nullable=False)
    width_inch = Column(Float, nullable=False)
    total_defect_points = Column(Integer, default=0)
    summary_point = Column(Float, nullable=False)                          # (total_points * 3600) / (width_inch * length_after)
    grade = Column(String(10), nullable=False)                             # 'GRADE_A', 'GRADE_B', 'GRADE_C'
    defect_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    receipt = relationship("MaterialReceipt", foreign_keys=[receipt_id])
    inspector = relationship("Karyawan", foreign_keys=[inspector_id])

class MaterialAllocation(Base):
    __tablename__ = "material_allocations"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    item_id = Column(String(50), ForeignKey("inventory_items.id"), nullable=False)
    dispatch_date = Column(Date, nullable=False)
    qty_issued = Column(Float, nullable=False)
    surat_jalan_no = Column(String(100), nullable=True)                    # 'CJM-2608.100' (Sheet25)

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])
    item = relationship("InventoryItem", foreign_keys=[item_id])

# 8.4 Cutting, Consumption & Preparation Tasks
class CuttingRecord(Base):
    __tablename__ = "cutting_records"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    cutting_date = Column(Date, nullable=False)
    operator_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    qty_cut = Column(Integer, nullable=False)
    size_breakdown_cut = Column(JSON, default={})
    main_fabric_used = Column(Float, nullable=False)
    puring_used = Column(Float, default=0.0)
    puring_jala_used = Column(Float, default=0.0)
    main_consumption_rate = Column(Float, default=0.0)                     # main_fabric_used / qty_cut
    puring_consumption_rate = Column(Float, default=0.0)                   # puring_used / qty_cut
    
    # 🔍 FIELD PENGAYAAN MEJA POTONG
    marker_length_yard = Column(Float, default=0.0)                        # Panjang Lembar Marker
    marker_efficiency_pct = Column(Float, default=0.0)                     # Efisiensi Pola (%)
    gelaran_layers = Column(Integer, default=1)                            # Jumlah Tumpukan Lembar Kain (Ply)
    fabric_waste_yards = Column(Float, default=0.0)                        # Sisa Kain Perca / Afval
    created_at = Column(DateTime, default=datetime.utcnow)

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])
    operator = relationship("Karyawan", foreign_keys=[operator_id])

class CuttingPrepTask(Base):
    __tablename__ = "cutting_prep_tasks"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    task_type = Column(String(50), nullable=False)                         # 'NUMBERING', 'PRESS_INTERLINING'
    operator_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    task_date = Column(Date, nullable=False)
    qty_done = Column(Integer, nullable=False)
    size_breakdown = Column(JSON, default={})
    piece_rate = Column(Float, default=0.0)
    total_wage = Column(Float, default=0.0)

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])
    operator = relationship("Karyawan", foreign_keys=[operator_id])

# 8.5 Sequential WIP Pipeline Movements (Print M -> Bordir M -> Sewing -> Washing -> Bordir J -> Finishing)
class WIPMovement(Base):
    __tablename__ = "wip_movements"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    stage_name = Column(String(50), nullable=False)                        # 'PRINT_MENTAH', 'EMBROIDERY_MENTAH', 'SEWING_INTERNAL', 'SEWING_MAKLUN', 'WASHING', 'EMBROIDERY_JADI', 'FINISHING'
    sequence_order = Column(Integer, nullable=False, default=1)            # 1: Print, 2: Bordir M, 3: Sewing, 4: Washing, 5: Bordir J, 6: Finishing
    partner_id = Column(String(50), ForeignKey("partners.id"), nullable=True) # Subcon / Maklun Vendor (NULL jika internal)
    internal_supervisor_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    surat_jalan_no = Column(String(100), nullable=True)
    dispatch_date = Column(Date, nullable=False)
    qty_dispatched = Column(Integer, nullable=False)
    size_breakdown_dispatched = Column(JSON, default={})
    received_date = Column(Date, nullable=True)
    qty_received = Column(Integer, default=0)
    qty_reject = Column(Integer, default=0)
    size_breakdown_received = Column(JSON, default={})
    balance_discrepancy = Column(Integer, default=0)                       # qty_dispatched - (qty_received + qty_reject)
    status = Column(String(30), default="IN_PROCESS")                      # 'IN_PROCESS', 'PARTIAL_RECEIVED', 'COMPLETED', 'DISCREPANCY_FLAG'
    remarks = Column(Text, nullable=True)

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])
    partner = relationship("Partner", foreign_keys=[partner_id])
    supervisor = relationship("Karyawan", foreign_keys=[internal_supervisor_id])

class RejectLog(Base):
    __tablename__ = "reject_logs"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    wip_movement_id = Column(String(50), ForeignKey("wip_movements.id"), nullable=True)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    stage_name = Column(String(50), nullable=False)                        # 'EMBROIDERY_DEFECT', 'SEWING_DEFECT', 'WASHING_DEFECT'
    defect_reason = Column(String(100), nullable=False)                    # 'JARUM PATAH', 'BELANG WARNA', 'SOBEK'
    qty_reject = Column(Integer, nullable=False)
    unit_cost_loss = Column(Float, default=0.0)
    total_loss = Column(Float, default=0.0)

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])

# 8.6 Finishing Borongan, Expedisi Shipping & Billing Form WI
class PieceRateWage(Base):
    __tablename__ = "piece_rate_wages"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    operator_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    operation_type = Column(String(50), nullable=False)                    # 'STIM', 'LUBANG_KANCING', 'PASANG_KANCING', 'LIPAT', 'PACKING'
    work_date = Column(Date, nullable=False)
    qty_completed = Column(Integer, nullable=False)
    wage_per_piece = Column(Float, nullable=False)                         # misal Rp500 atau Rp600
    total_wage = Column(Float, default=0.0)

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])
    operator = relationship("Karyawan", foreign_keys=[operator_id])

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    so_id = Column(String(50), ForeignKey("sales_orders.id"), nullable=False)
    shipment_date = Column(Date, nullable=False)
    surat_jalan_no = Column(String(100), unique=True, nullable=False)      # 'SJP-2608.0001'
    driver_id = Column(String(50), ForeignKey("karyawan.id_karyawan"), nullable=True)
    total_qty_shipped = Column(Integer, nullable=False)
    size_breakdown_shipped = Column(JSON, default={})
    unit_price = Column(Float, default=0.0)
    total_invoice_amount = Column(Float, default=0.0)
    invoice_number = Column(String(100), nullable=True)
    is_invoiced = Column(Boolean, default=False)
    remarks = Column(Text, nullable=True)

    # 🔍 FIELD PENGAYAAN EKSPEDISI & PENGIRIMAN
    driver_name = Column(String(100), nullable=True)                       # Nama Supir Ekspedisi
    vehicle_plate_no = Column(String(50), nullable=True)                   # Nomor Polisi Truk / Mobil
    carton_box_count = Column(Integer, default=0)                          # Jumlah Koli / Dus Karton
    destination_address = Column(Text, nullable=True)                      # Alamat Gudang Tujuan Buyer

    sales_order = relationship("SalesOrder", foreign_keys=[so_id])
    driver = relationship("Karyawan", foreign_keys=[driver_id])