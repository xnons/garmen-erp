from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
import models

# 🟢 1. Helper Security dari core
from core.security import get_password_hash

# 🟢 2. Import Routers (Termasuk audit)
from routers import auth, karyawan, mesin, inventaris, dashboard, audit, payroll
from routers import produksi_master, produksi_output

# Buat Tabel Database Otomatis jika belum ada
models.Base.metadata.create_all(bind=engine)


# --- LIFESPAN SEEDER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
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

import os

# --- CORS MIDDLEWARE ---
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🟢 3. REGISTRASI ROUTERS
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(karyawan.router)
app.include_router(mesin.router)
app.include_router(inventaris.router)
# 🟢 Router Payroll & Penggajian
app.include_router(payroll.router)

# 🟢 Router Dashboard
app.include_router(dashboard.router)

# 🟢 Router Produksi
app.include_router(produksi_master.router)
app.include_router(produksi_output.router)

# 🟢 Router Audit & Keamanan (Baru Ditambahkan)
app.include_router(audit.router)

@app.get("/")
def root_check():
    return {
        "status": "Online",
        "system": "Nexora ERP Engine",
        "version": "1.2.0"
    }