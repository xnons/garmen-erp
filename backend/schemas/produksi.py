from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import date, datetime
from enum import Enum


# ===========================================================================
# ENUMERATIONS
# ===========================================================================
class StatusSPK(str, Enum):
    DRAFT = "DRAFT"
    ON_PROGRESS = "ON_PROGRESS"
    FINISHED = "FINISHED"
    ARCHIVED = "ARCHIVED"


class TahapanProses(str, Enum):
    CUTTING = "CUTTING"
    PERSIAPAN_PRESS = "PERSIAPAN_PRESS"
    SEWING = "SEWING"
    BUANG_BENANG = "BUANG_BENANG"
    FINISHING_PRESS = "FINISHING_PRESS"
    PACKING = "PACKING"


class StatusVerifikasiOutput(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PrioritasSPK(str, Enum):
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TipeOrder(str, Enum):
    CMT = "CMT"
    FOB = "FOB"
    HYBRID = "HYBRID"


class StatusAccSampel(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REVISION = "REVISION"


# ===========================================================================
# 1. MASTER TARIF BORONGAN SCHEMAS
# ===========================================================================
class MasterTarifBase(BaseModel):
    tahapan_proses: TahapanProses
    tarif_per_pcs: float = Field(gt=0, description="Tarif rupiah per-pcs (Wajib > 0)")
    keterangan: Optional[str] = None


class MasterTarifCreate(MasterTarifBase):
    pass


class MasterTarifUpdate(BaseModel):
    tarif_per_pcs: Optional[float] = Field(default=None, gt=0)
    keterangan: Optional[str] = None


class MasterTarifResponse(BaseModel):
    id: int
    spk_id: str
    tahapan_proses: Optional[str] = None
    tarif_per_pcs: Optional[float] = 0.0
    keterangan: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


# ===========================================================================
# 2. SPK PRODUKSI SCHEMAS
# ===========================================================================
class SPKBase(BaseModel):
    id: str = Field(..., description="Kode/Nomor SPK")
    nama_pemesan: Optional[str] = None
    kontak_pemesan: Optional[str] = None
    no_po_buyer: Optional[str] = None
    alamat_pengiriman: Optional[str] = None

    nama_artikel: str
    kategori_produk: Optional[str] = Field(default="Kemeja")
    prioritas: Optional[str] = Field(default="NORMAL")
    deskripsi: Optional[str] = None
    foto_sampel: Optional[str] = None
    link_google_drive: Optional[str] = None

    size_matrix: Optional[Dict[str, int]] = Field(default_factory=dict)
    target_qty: Optional[int] = Field(default=0, ge=0)

    tipe_order: Optional[str] = Field(default="CMT")
    penyedia_kain: Optional[str] = Field(default="CUSTOMER")
    penyedia_aksesoris: Optional[str] = Field(default="CUSTOMER")
    jenis_kain: Optional[str] = None
    warna_kain: Optional[str] = None
    aksesoris: Optional[str] = None
    spesifikasi_sablon_bordir: Optional[str] = None
    toleransi_defect_pct: Optional[float] = Field(default=2.0, ge=0.0, le=100.0)

    biaya_kain_per_pcs: Optional[float] = Field(default=0.0, ge=0.0)
    biaya_aksesoris_per_pcs: Optional[float] = Field(default=0.0, ge=0.0)
    biaya_maklon_luar_per_pcs: Optional[float] = Field(default=0.0, ge=0.0)
    konsumsi_kain_per_pcs: Optional[float] = Field(default=0.0, ge=0.0)

    tanggal_mulai: Optional[date] = None
    target_cutting: Optional[date] = None
    target_sewing: Optional[date] = None
    deadline: Optional[date] = None
    dp_nominal: Optional[float] = Field(default=0.0, ge=0.0)
    status_acc_sampel: Optional[str] = Field(default="APPROVED")

    harga_jual_per_pcs: Optional[float] = Field(default=0.0, ge=0.0)


class SPKCreate(SPKBase):
    tanggal_mulai: date
    deadline: date
    tarif_initial: Optional[List[MasterTarifCreate]] = Field(default=[])


class SPKUpdate(BaseModel):
    nama_pemesan: Optional[str] = None
    kontak_pemesan: Optional[str] = None
    no_po_buyer: Optional[str] = None
    alamat_pengiriman: Optional[str] = None
    nama_artikel: Optional[str] = None
    kategori_produk: Optional[str] = None
    prioritas: Optional[PrioritasSPK] = None
    deskripsi: Optional[str] = None
    foto_sampel: Optional[str] = None
    link_google_drive: Optional[str] = None
    size_matrix: Optional[Dict[str, int]] = None
    target_qty: Optional[int] = Field(default=None, ge=0)
    realisasi_potong: Optional[int] = Field(default=None, ge=0)
    
    tipe_order: Optional[TipeOrder] = None
    penyedia_kain: Optional[str] = None
    penyedia_aksesoris: Optional[str] = None
    jenis_kain: Optional[str] = None
    warna_kain: Optional[str] = None
    aksesoris: Optional[str] = None
    spesifikasi_sablon_bordir: Optional[str] = None
    toleransi_defect_pct: Optional[float] = None
    
    biaya_kain_per_pcs: Optional[float] = None
    biaya_aksesoris_per_pcs: Optional[float] = None
    biaya_maklon_luar_per_pcs: Optional[float] = None
    konsumsi_kain_per_pcs: Optional[float] = None
    
    tanggal_mulai: Optional[date] = None
    target_cutting: Optional[date] = None
    target_sewing: Optional[date] = None
    deadline: Optional[date] = None
    dp_nominal: Optional[float] = None
    status_acc_sampel: Optional[StatusAccSampel] = None
    status: Optional[StatusSPK] = None
    harga_jual_per_pcs: Optional[float] = None


class SPKResponse(SPKBase):
    realisasi_potong: Optional[int] = 0
    status: Optional[str] = "DRAFT"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class SPKDetailResponse(SPKResponse):
    tarif_list: List[MasterTarifResponse] = []


# ===========================================================================
# 3. LOG OUTPUT HARIAN SCHEMAS
# ===========================================================================
class LogOutputBase(BaseModel):
    tanggal: Optional[date] = None
    karyawan_id: str
    spk_id: str
    tahapan_proses: Optional[str] = "SEWING"
    nomor_tiket: Optional[str] = None      # 🟢 Tambahkan field nomor tiket
    qty_disetor: Optional[int] = Field(default=0, ge=0)
    qty_pass: Optional[int] = Field(default=0, ge=0)
    qty_rework: Optional[int] = Field(default=0, ge=0)  # 🟢 Tambahkan rework
    qty_scrap: Optional[int] = Field(default=0, ge=0)   # 🟢 Tambahkan scrap/BS
    qty_reject: Optional[int] = Field(default=0, ge=0)
    catatan: Optional[str] = None


class LogOutputCreate(LogOutputBase):
    tanggal: date
    qty_disetor: int = Field(gt=0)
    foto_bukti_setoran: Optional[str] = None


class LogOutputUpdate(BaseModel):
    qty_disetor: Optional[int] = Field(default=None, gt=0)
    qty_pass: Optional[int] = Field(default=None, ge=0)
    qty_reject: Optional[int] = Field(default=None, ge=0)
    foto_bukti_setoran: Optional[str] = None
    foto_bukti_defect: Optional[str] = None
    catatan: Optional[str] = None


class LogOutputVerifikasi(BaseModel):
    status_verifikasi: StatusVerifikasiOutput
    catatan: Optional[str] = None
    foto_bukti_defect: Optional[str] = None


class BulkVerifyRequest(BaseModel):
    log_ids: List[int] = Field(..., min_length=1)
    status_verifikasi: StatusVerifikasiOutput
    catatan: Optional[str] = None


class LogOutputResponse(LogOutputBase):
    id: int
    tarif_per_pcs: Optional[float] = 0.0
    subtotal_rp: Optional[float] = 0.0
    status_verifikasi: Optional[str] = "PENDING"
    petugas_input: Optional[str] = None
    verifier_id: Optional[str] = None
    foto_bukti_setoran: Optional[str] = None
    foto_bukti_defect: Optional[str] = None
    
    is_paid: Optional[bool] = False
    payroll_id: Optional[str] = None
    paid_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
    
    nama_karyawan: Optional[str] = None
    nama_artikel: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


# ===========================================================================
# 4. PAYROLL & UPAH BORONGAN SCHEMAS
# ===========================================================================
class PayrollLogItem(BaseModel):
    log_id: int
    tanggal: Optional[date] = None
    spk_id: str
    nama_artikel: Optional[str] = "-"
    tahapan_proses: Optional[str] = "SEWING"
    qty_pass: Optional[int] = 0
    tarif_per_pcs: Optional[float] = 0.0
    subtotal_rp: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class RekapGajiPekerjaResponse(BaseModel):
    karyawan_id: str
    nama_karyawan: str
    tipe_pay: Optional[str] = "BORONGAN"
    total_setoran_approved: Optional[int] = 0
    total_pcs_pass: Optional[int] = 0
    total_gaji_unpaid_rp: Optional[float] = 0.0
    total_gaji_paid_rp: Optional[float] = 0.0
    detail_unpaid_logs: List[PayrollLogItem] = []


class MarkPayrollPaidRequest(BaseModel):
    karyawan_ids: List[str]
    payroll_id: str


# ===========================================================================
# 5. ANALYTICS SCHEMAS
# ===========================================================================
class DailyTrendPoint(BaseModel):
    tanggal: str
    total_pcs_disetor: Optional[int] = 0
    total_pcs_pass: Optional[int] = 0
    total_pcs_reject: Optional[int] = 0
    total_upah_rp: Optional[float] = 0.0


class SPKProgressItem(BaseModel):
    spk_id: str
    nama_artikel: Optional[str] = "-"
    target_qty: Optional[int] = 0
    realisasi_potong: Optional[int] = 0
    progress_sewing: Optional[int] = 0
    progress_packing: Optional[int] = 0
    persentase_selesai: Optional[float] = 0.0
    status: Optional[str] = "DRAFT"


class DefectRateByTahapan(BaseModel):
    tahapan_proses: Optional[str] = "SEWING"
    total_disetor: Optional[int] = 0
    total_reject: Optional[int] = 0
    defect_rate_pct: Optional[float] = 0.0


class TopWorkerItem(BaseModel):
    karyawan_id: str
    nama_karyawan: str
    total_pcs_pass: Optional[int] = 0
    total_pendapatan_rp: Optional[float] = 0.0


class ProductionAnalyticsDashboard(BaseModel):
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    total_output_pass: Optional[int] = 0
    total_output_reject: Optional[int] = 0
    average_defect_rate: Optional[float] = 0.0
    total_upah_borongan: Optional[float] = 0.0
    trend_harian: List[DailyTrendPoint] = []
    progress_spk: List[SPKProgressItem] = []
    defect_breakdown: List[DefectRateByTahapan] = []
    top_workers: List[TopWorkerItem] = []