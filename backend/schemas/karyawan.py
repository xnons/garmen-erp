from pydantic import BaseModel, Field
from typing import Optional


# 🟢 1. SCHEMA REGISTRASI / TAMBAH KARYAWAN BARU
class RegisterInput(BaseModel):
    id_karyawan: Optional[str] = None
    nama: str
    username: str
    password: str
    pin: Optional[str] = "1234"
    role: str = "PRODUKSI"
    
    # BIODATA & PEKERJAAN
    jabatan: str = "Operator Produksi"
    tanggal_lahir: Optional[str] = None
    no_hp: Optional[str] = None
    alamat: Optional[str] = None
    status_karyawan: str = "KONTRAK"
    tanggal_masuk: Optional[str] = None
    
    # PENGGAJIAN
    tipe_pay: str = "BORONGAN"  # BORONGAN / HARIAN / BULANAN
    gaji_pokok: int = 0
    tarif_borongan_pcs: int = 0

# 🔗 Alias agar router yang memanggil KaryawanCreate tetap berjalan kompatibel
KaryawanCreate = RegisterInput


# 🟢 2. SCHEMA UPDATE BIODATA & GAJI KARYAWAN OLEH ADMIN
class UpdateKaryawanInput(BaseModel):
    nama: Optional[str] = None
    role: Optional[str] = None
    jabatan: Optional[str] = None
    tanggal_lahir: Optional[str] = None
    no_hp: Optional[str] = None
    alamat: Optional[str] = None
    status_karyawan: Optional[str] = None
    tipe_pay: Optional[str] = None
    gaji_pokok: Optional[int] = None
    tarif_borongan_pcs: Optional[int] = None
    is_active: Optional[bool] = None


# 🟢 3. SCHEMA LOGIN USER
class LoginInput(BaseModel):
    username: str
    password: str


# 🟢 4. SCHEMA CATAT SANKSI / PELANGGARAN PEKERJA
class PelanggaranInput(BaseModel):
    jenis: str = Field(..., json_schema_extra={"example": "Ringan"})
    poin: int = Field(..., ge=1, json_schema_extra={"example": 5})
    keterangan: str = Field(..., min_length=3, json_schema_extra={"example": "Terlambat masuk shift kerja"})


# 🟢 5. SCHEMA UPDATE PIN SECURITY GATE
class UpdatePinInput(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4, json_schema_extra={"example": "1234"})


# 🟢 6. SCHEMA VERIFIKASI SECURITY GATE (PIN GATE)
class PinVerifyInput(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4, json_schema_extra={"example": "1234"})

class PinVerifySchema(BaseModel):
    pin: str = Field(..., min_length=4, max_length=4, description="PIN Security Gate 4 digit")

class PinUpdateSchema(BaseModel):
    old_pin: str = Field(..., min_length=4, max_length=4, description="PIN Lama 4 digit")
    new_pin: str = Field(..., min_length=4, max_length=4, description="PIN Baru 4 digit")