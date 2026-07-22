from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, get_db
import models
from core.security import get_password_hash

# Import Routers
from routers import auth, karyawan

# 1. Buat Tabel Database Otomatis jika belum ada
models.Base.metadata.create_all(bind=engine)


# 2. Seeder Startup Menggunakan Lifespan Handler (Standar FastAPI Terbaru)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- PROSES STARTUP ---
    db = next(get_db())
    try:
        owner_exist = db.query(models.Karyawan).filter(models.Karyawan.username == "admin.nexora").first()
        if not owner_exist:
            user_master = models.Karyawan(
                id_karyawan="KRY-2026-001",
                nama="Bapak Owner Nexora",
                username="admin.nexora",
                hashed_password=get_password_hash("masterpassword123"),
                pin="1234",
                role="OWNER",
                jabatan="General Manager / Owner",
                tanggal_lahir="1991-01-01",  # 🟢 Menggunakan tanggal_lahir sesuai schema baru
                no_hp="081234567890",
                alamat="Head Office Nexora Garment",
                status_karyawan="TETAP",
                tanggal_masuk="2026-01-01",
                is_active=True,
                tipe_pay="BULANAN",
                gaji_pokok=10000000,
                tarif_borongan_pcs=0,
                total_hadir=25, 
                total_terlambat=0, 
                total_izin=0, 
                total_alpa=0, 
                poin_pelanggaran=0
            )
            db.add(user_master)
            db.commit()
            print("🟢 Akun Master 'admin.nexora' & PIN Gate '1234' berhasil dibuat!")
    except Exception as e:
        print(f"⚠️ Info Seeder: {e}")
    finally:
        db.close()
    
    yield  # Server siap melayani request...
    
    # --- PROSES SHUTDOWN (Opsional) ---
    print("🔴 Engine Nexora ERP dimatikan.")


# 3. Inisialisasi Aplikasi FastAPI
app = FastAPI(
    title="Nexora Garment ERP - Enterprise Engine",
    description="Sistem autentikasi, manajemen karyawan, dan log kedisiplinan terintegrasi.",
    version="1.1.0",
    lifespan=lifespan
)


# 4. Konfigurasi CORS Paling Fleksibel (Localhost & IP Lokal)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",  # Mengizinkan port berapapun di local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 5. Registrasi Routers
# Router Auth dengan prefix /api/auth
app.include_router(auth.router, prefix="/api/auth", tags=["Auth & PIN Gate"])

# Router Karyawan TANPA prefix tambahan (karena prefix /api sudah diset di routers/karyawan.py)
app.include_router(karyawan.router) 


# 6. Health Check Root Endpoint
@app.get("/")
def root_check():
    return {
        "status": "Online",
        "system": "Nexora ERP Engine",
        "version": "1.1.0"
    }