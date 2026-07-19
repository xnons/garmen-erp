import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
import jwt
import bcrypt

# --- INTEGRASI DATABASE NEXORA ---
from sqlalchemy.orm import Session
import models
from database import engine, get_db

# Membuat tabel otomatis di database sqlite saat aplikasi pertama kali dijalankan
models.Base.metadata.create_all(bind=engine)

# Konfigurasi keamanan dasar dan waktu kedaluwarsa token (8 jam kerja)
JWT_SECRET = "rahasia_super_duper_aman_garmen_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

app = FastAPI(
    title="Nexora Garment ERP - Enterprise Engine",
    description="Sistem autentikasi, manajemen karyawan, dan log kedisiplinan terintegrasi.",
    version="1.1.0"
)

# Pengaturan CORS agar backend bisa diakses secara online oleh frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pengaturan enkripsi kata sandi dan token JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# =========================================================================
# 🛠️ UTILITY & SECURITY FUNCTIONS
# =========================================================================

def get_password_hash(password: str) -> str:
    """Mengubah password teks biasa menjadi hash Bcrypt yang aman."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Mencocokkan password input dengan hash yang tersimpan di database."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False
    
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Membuat tanda masuk digital berupa JWT Token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

# =========================================================================
# 📋 PYDANTIC SCHEMAS (VALIDASI DATA INPUT API)
# =========================================================================

class RegisterInput(BaseModel):
    id_karyawan: str = Field(..., example="KRY-2026-001")
    nama: str = Field(..., example="Budi Santoso")
    username: str = Field(..., example="budi.produksi")
    password: str = Field(..., min_length=6)
    role: str = Field(..., example="PRODUKSI")  # ADMIN, FINANCE, GUDANG, PRODUKSI, OWNER
    tipe_pay: str = Field(..., example="BORONGAN")  # BULANAN, BORONGAN
    tarif_borongan_pcs: int = Field(0, ge=0)

class LoginInput(BaseModel):
    username: str
    password: str

class PelanggaranInput(BaseModel):
    jenis: str = Field(..., example="Ringan") # Ringan, Sedang, atau Berat
    poin: int = Field(..., ge=1, example=5)
    keterangan: str = Field(..., min_length=3, example="Terlambat masuk shift kerja")

# =========================================================================
# 🛡️ ROLE GUARD DEPENDENCY (Ditaruh di atas agar bisa dibaca oleh rute API)
# =========================================================================

def get_current_user_role(token: str = Depends(oauth2_scheme)):
    """Membaca token JWT secara tersentralisasi dan mengekstrak Hak Akses (Role)."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kredensial tidak valid")
        return role
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi masuk telah berakhir, silakan login ulang.")

# =========================================================================
# ⚙️ SEEDER OTOMATIS SYSTEM STARTUP
# =========================================================================

@app.on_event("startup")
def seeder_karyawan_master():
    """Membuat akun Owner master otomatis jika database masih kosong saat aplikasi menyala."""
    db = next(get_db())
    try:
        owner_exist = db.query(models.Karyawan).filter(models.Karyawan.username == "admin.nexora").first()
        if not owner_exist:
            user_master = models.Karyawan(
                id_karyawan="KRY-2026-001",
                nama="Bapak Owner Nexora",
                username="admin.nexora",
                hashed_password=get_password_hash("masterpassword123"),
                role="OWNER",
                tipe_pay="BULANAN",
                tarif_borongan_pcs=0,
                total_hadir=25,
                total_terlambat=1,
                total_izin=0,
                total_alpa=0,
                poin_pelanggaran=0
            )
            db.add(user_master)
            db.commit()
            print("🟢 Database terdeteksi kosong. Akun Master 'admin.nexora' dengan password 'masterpassword123' berhasil dibuat!")
    finally:
        db.close()

# =========================================================================
# 🔏 JALUR RUTE API (ENDPOINTS AUTENTIKASI)
# =========================================================================

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register_karyawan(
    user_data: RegisterInput, 
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    """Endpoint internal terproteksi. Hanya ADMIN atau OWNER yang boleh mendaftarkan karyawan."""
    if current_user_role not in ["ADMIN", "OWNER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya Admin atau Owner yang memiliki wewenang mendaftarkan staff."
        )

    karyawan_lama = db.query(models.Karyawan).filter(models.Karyawan.username == user_data.username).first()
    if karyawan_lama:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username tersebut sudah terdaftar di sistem!"
        )
    
    hashed_password = get_password_hash(user_data.password)
    
    karyawan_baru = models.Karyawan(
        id_karyawan=user_data.id_karyawan,
        nama=user_data.nama,
        username=user_data.username,
        hashed_password=hashed_password,
        role=user_data.role.upper(),
        tipe_pay=user_data.tipe_pay.upper(),
        tarif_borongan_pcs=user_data.tarif_borongan_pcs,
        total_hadir=0,
        total_terlambat=0,
        total_izin=0,
        total_alpa=0,
        poin_pelanggaran=0
    )
    
    db.add(karyawan_baru)
    db.commit()
    db.refresh(karyawan_baru)
    
    return {"message": f"Karyawan {user_data.nama} sukses didaftarkan dengan jabatan {user_data.role}!"}


@app.post("/api/auth/login")
async def login(credentials: LoginInput, db: Session = Depends(get_db)):
    """Endpoint login untuk verifikasi kredensial dan mencetak token JWT."""
    user = db.query(models.Karyawan).filter(models.Karyawan.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kombinasi Username atau Password salah!"
        )
    
    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id_karyawan": user.id_karyawan,
            "nama": user.nama,
            "username": user.username,
            "role": user.role,
            "total_hadir": user.total_hadir,
            "total_terlambat": user.total_terlambat,
            "total_izin": user.total_izin,
            "total_alpa": user.total_alpa,
            "poin_pelanggaran": user.poin_pelanggaran
        }
    }

# =========================================================================
# 🧵 JALUR RUTE API (OPERASIONAL KARYAWAN & KEDISIPLINAN)
# =========================================================================

@app.get("/api/karyawan")
async def get_all_karyawan(db: Session = Depends(get_db)):
    """Endpoint umum internal untuk menarik list data karyawan aktif untuk tabel frontend."""
    daftar_pekerja = db.query(models.Karyawan).all()
    return [
        {
            "id_karyawan": p.id_karyawan,
            "nama": p.nama,
            "username": p.username,
            "role": p.role,
            "tipe_pay": p.tipe_pay,
            "tarif_borongan_pcs": p.tarif_borongan_pcs,
            "poin_pelanggaran": p.poin_pelanggaran # 🟢 Sekarang dikirim agar ter-render di list frontend
        }
        for p in daftar_pekerja
    ]


@app.post("/api/karyawan/{id_karyawan}/pelanggaran")
async def tambah_pelanggaran_karyawan(
    id_karyawan: str,
    input_data: PelanggaranInput,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    """🔏 PROTEKSI OWNER: Membuat riwayat berita acara sanksi dan menambah akumulasi poin."""
    if current_user_role != "OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya Owner yang memiliki wewenang memberikan sanksi pelanggaran."
        )
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == id_karyawan).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail="Data karyawan tidak ditemukan.")
        
    # 1. Catat log baris baru ke tabel riwayat audit
    tgl_sekarang = datetime.now().strftime("%d-%m-%Y")
    log_baru = models.LogPelanggaran(
        id_karyawan=id_karyawan,
        jenis=input_data.jenis,
        poin=input_data.poin,
        keterangan=input_data.keterangan,
        tanggal=tgl_sekarang
    )
    db.add(log_baru)

    # 2. Akumulasikan ke master tabel poin karyawan
    karyawan.poin_pelanggaran += input_data.poin
    db.commit()
    
    return {"message": f"Berhasil mencatat sanksi +{input_data.poin} poin ke log {karyawan.nama}."}


@app.get("/api/karyawan/{id_karyawan}/pelanggaran")
async def ambil_riwayat_pelanggaran(
    id_karyawan: str,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    """🔑 PROTEKSI AKSES: Menampilkan seluruh lembar rekam jejak insiden milik 1 karyawan tertentu."""
    if current_user_role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Akses ditolak! Menu log ini rahasia.")
        
    logs = db.query(models.LogPelanggaran).filter(models.LogPelanggaran.id_karyawan == id_karyawan).all()
    return logs


@app.delete("/api/pelanggaran/{id_log}")
async def hapus_pelanggaran_karyawan(
    id_log: int,
    db: Session = Depends(get_db),
    current_user_role: str = Depends(get_current_user_role)
):
    """🔏 PROTEKSI OWNER (PEMUTIHAN): Menghapus log insiden salah input dan memotong poin kembali aman."""
    if current_user_role != "OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya Owner yang berhak melakukan pemutihan/pencabutan sanksi."
        )
        
    log = db.query(models.LogPelanggaran).filter(models.LogPelanggaran.id == id_log).first()
    if not log:
        raise HTTPException(status_code=404, detail="Catatan sanksi dimaksud tidak ditemukan.")
        
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == log.id_karyawan).first()
    if karyawan:
        # Kurangi akumulasi poin, minimal mentok di 0 (tidak boleh minus)
        karyawan.poin_pelanggaran = max(0, karyawan.poin_pelanggaran - log.poin)
        
    db.delete(log)
    db.commit()
    
    return {"message": "Catatan sanksi berhasil dicabut dan poin pekerja dikembalikan normal."}


@app.get("/api/finance/report")
async def get_finance_report(role: str = Depends(get_current_user_role)):
    """Contoh rute rahasia ber-hak akses finansial tinggi."""
    if role not in ["FINANCE", "OWNER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Menu ini memerlukan hak akses divisi Keuangan atau Owner."
        )
    return {"message": "Akses Diterima. Berikut adalah data keuangan garmen rahasia Anda."}