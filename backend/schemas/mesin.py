from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MesinBase(BaseModel):
    nama_mesin: str
    kategori: str
    merk_tipe: Optional[str] = None
    lokasi_line: str
    status: Optional[str] = "OPERASIONAL"
    operator_id: Optional[str] = None
    keterangan: Optional[str] = None

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

class MesinResponse(MesinBase):
    id: int
    kode_mesin: str
    created_at: datetime
    nama_operator: Optional[str] = None

    class Config:
        from_attributes = True