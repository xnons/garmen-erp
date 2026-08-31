from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class MesinBase(BaseModel):
    nama_mesin: str
    kategori: str
    merk_tipe: Optional[str] = None
    lokasi_line: str
    status: Optional[str] = "OPERASIONAL"
    operator_id: Optional[str] = None
    keterangan: Optional[str] = None
    
    # Finansial & Pembayaran
    harga_beli: Optional[float] = 0.0
    jumlah_terbayar: Optional[float] = 0.0
    sisa_pembayaran: Optional[float] = 0.0
    status_pembayaran: Optional[str] = "LUNAS"
    vendor_supplier: Optional[str] = None
    no_seri: Optional[str] = None
    tanggal_pembelian: Optional[str] = None
    garansi_hingga: Optional[str] = None
    riwayat_pembayaran: Optional[List[Any]] = []

class MesinCreate(MesinBase):
    kode_mesin: Optional[str] = None  # Jika kosong, backend buatkan otomatis (MSN-XXX)

class MesinUpdate(BaseModel):
    nama_mesin: Optional[str] = None
    kategori: Optional[str] = None
    merk_tipe: Optional[str] = None
    lokasi_line: Optional[str] = None
    status: Optional[str] = None
    operator_id: Optional[str] = None
    keterangan: Optional[str] = None
    
    harga_beli: Optional[float] = None
    jumlah_terbayar: Optional[float] = None
    sisa_pembayaran: Optional[float] = None
    status_pembayaran: Optional[str] = None
    vendor_supplier: Optional[str] = None
    no_seri: Optional[str] = None
    tanggal_pembelian: Optional[str] = None
    garansi_hingga: Optional[str] = None
    riwayat_pembayaran: Optional[List[Any]] = None

class MesinResponse(MesinBase):
    id: int
    kode_mesin: str
    created_at: datetime
    nama_operator: Optional[str] = None

    class Config:
        from_attributes = True