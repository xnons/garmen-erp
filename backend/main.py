from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, get_db
import models

# 🟢 1. Helper Security dari core
from core.security import get_password_hash

# 🟢 2. Import Routers secara spesifik (Cegah Bentrok Nama Modul)
from routers import auth, karyawan, mesin  # 👈 Ditambahkan 'mesin' di sini
from routers.security import router as security_router

# Buat Tabel Database Otomatis jika belum ada
models.Base.metadata.create_all(bind=engine)


# --- LIFESPAN SEEDER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = next(get_db())
    try:
        # Seeder Akun Owner Master
        owner_exist = db.query(models.Karyawan).filter(models.Karyawan.username == "admin.nexora").first()
        if not owner_exist:
            user_master = models.Karyawan(
                id_karyawan="KRY-2026-001",
                nama="Bapak Owner Nexora",
                username="admin.nexora",
                hashed_password=get_password_hash("masterpassword123"),
                role="OWNER",
                jabatan="General Manager / Owner",
                tanggal_lahir="1991-01-01",
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
            print("🟢 Akun Master 'admin.nexora' berhasil dibuat!")

        # Seeder Master PIN Security Gate
        sec_exist = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
        if not sec_exist:
            master_pin = models.SystemSecurity(
                id=1,
                master_pin_hash=get_password_hash("1234"),
                updated_by="SYSTEM"
            )
            db.add(master_pin)
            db.commit()
            print("🔒 Master PIN Security Gate '1234' berhasil diinisialisasi!")

    except Exception as e:
        print(f"⚠️ Info Seeder: {e}")
    finally:
        db.close()
    
    yield
    print("🔴 Engine Nexora ERP dimatikan.")


# --- FASTAPI APP ---
app = FastAPI(
    title="Nexora Garment ERP - Enterprise Engine",
    description="Sistem autentikasi, manajemen karyawan, inventaris mesin, dan log kedisiplinan terintegrasi.",
    version="1.2.0",
    lifespan=lifespan
)

# --- CORS MIDDLEWARE ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🟢 3. REGISTRASI ROUTERS
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(security_router)  # Menggunakan alias security_router
app.include_router(karyawan.router)
app.include_router(mesin.router)      # 👈 ROUTER MESIN DIDAFTARKAN DI SINI


@app.get("/")
def root_check():
    return {
        "status": "Online",
        "system": "Nexora ERP Engine",
        "version": "1.2.0"
    }