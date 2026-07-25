from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import date, datetime

class KategoriBahan(str, Enum):
    KAIN = "KAIN"
    AKSESORIS = "AKSESORIS"
    BENANG = "BENANG"
    PACKAGING = "PACKAGING"
    LAINNYA = "LAINNYA"

class SatuanBahan(str, Enum):
    KG = "KG"
    YARD = "YARD"
    METER = "METER"
    PCS = "PCS"
    ROLL = "ROLL"
    CONE = "CONE"
    PACK = "PACK"

class StatusStok(str, Enum):
    AMAN = "AMAN"
    MENIPIS = "MENIPIS"
    HABIS = "HABIS"

class TipeMutasi(str, Enum):
    MASUK = "MASUK"
    KELUAR_PRODUKSI = "KELUAR_PRODUKSI"
    PENYESUAIAN = "PENYESUAIAN"
    RETUR = "RETUR"

# --- LOG MUTASI ---
class LogMutasiCreate(BaseModel):
    tipe: TipeMutasi
    jumlah: float = Field(..., gt=0, description="Jumlah mutasi bahan")
    referensi_po_spk: Optional[str] = "-"
    catatan: Optional[str] = None
    petugas: Optional[str] = "Admin Gudang"

class LogMutasiResponse(BaseModel):
    id: str
    item_id: str
    tanggal: datetime
    tipe: TipeMutasi
    jumlah: float
    stok_sebelum: float
    stok_sesudah: float
    referensi_po_spk: str
    catatan: str
    petugas: str

    class Config:
        from_attributes = True

# --- BAHAN BAKU ---
class BahanBakuBase(BaseModel):
    kode_sku: str
    nama_item: str
    kategori: KategoriBahan
    satuan: SatuanBahan
    stok_minimum: float = Field(default=10.0, ge=0)
    harga_per_satuan: float = Field(default=0.0, ge=0)
    lokasi_gudang: str
    supplier_utama: Optional[str] = "-"
    warna_kode: Optional[str] = "#3b82f6"

class BahanBakuCreate(BahanBakuBase):
    stok_awal: float = Field(default=0.0, ge=0)

class BahanBakuUpdate(BaseModel):
    nama_item: Optional[str] = None
    kategori: Optional[KategoriBahan] = None
    satuan: Optional[SatuanBahan] = None
    stok_minimum: Optional[float] = None
    harga_per_satuan: Optional[float] = None
    lokasi_gudang: Optional[str] = None
    supplier_utama: Optional[str] = None
    warna_kode: Optional[str] = None

class BahanBakuResponse(BahanBakuBase):
    id: str
    stok_saat_ini: float
    status_stok: StatusStok
    terakhir_diperbarui: date

    class Config:
        from_attributes = True