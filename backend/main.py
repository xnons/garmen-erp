from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
import models

# 🟢 1. Helper Security dari core
from core.security import get_password_hash

# 🟢 2. Import Routers (Termasuk audit & modul garment blueprint)
from routers import auth, karyawan, mesin, inventaris, dashboard, audit, payroll
from routers import produksi_master, produksi_output
from routers import ppic_so, warehouse_fabric, cutting_prep, wip_subcon, finishing_shipping
from routers import ai_copilot, email_reports

def init_db():
    try:
        models.Base.metadata.create_all(bind=engine)
        print("[Database Init]: Tabel database berhasil diverifikasi.")
    except Exception as e:
        print(f"[Database Error]: Gagal menghubungkan database saat inisialisasi: {e}")

def auto_migrate_db():
    try:
        with engine.connect() as conn:
            is_sqlite = engine.url.drivername.startswith("sqlite")
        columns_to_add = [
            ("log_output_borongan", "kode_mesin", "VARCHAR(50)"),
            ("log_output_borongan", "bahan_id", "VARCHAR(50)"),
            ("log_output_borongan", "jumlah_bahan_digunakan", "FLOAT DEFAULT 0.0"),
            ("log_login", "device_info", "VARCHAR(255)"),
            ("log_login", "lokasi", "VARCHAR(255)"),
            # Kolom baru SPK Produksi
            ("spk_produksi", "tipe_order", "VARCHAR(20) DEFAULT 'CMT'"),
            ("spk_produksi", "penyedia_kain", "VARCHAR(50) DEFAULT 'CUSTOMER'"),
            ("spk_produksi", "penyedia_aksesoris", "VARCHAR(50) DEFAULT 'CUSTOMER'"),
            ("spk_produksi", "biaya_kain_per_pcs", "FLOAT DEFAULT 0.0"),
            ("spk_produksi", "biaya_aksesoris_per_pcs", "FLOAT DEFAULT 0.0"),
            ("spk_produksi", "biaya_maklon_luar_per_pcs", "FLOAT DEFAULT 0.0"),
            ("spk_produksi", "konsumsi_kain_per_pcs", "FLOAT DEFAULT 0.0"),
            ("spk_produksi", "dp_nominal", "FLOAT DEFAULT 0.0"),
            ("spk_produksi", "link_google_drive", "VARCHAR(500)"),
            ("spk_produksi", "status_acc_sampel", "VARCHAR(30) DEFAULT 'APPROVED'"),
            # Kolom baru Mesin
            ("mesin", "harga_beli", "FLOAT DEFAULT 0.0"),
            ("mesin", "jumlah_terbayar", "FLOAT DEFAULT 0.0"),
            ("mesin", "sisa_pembayaran", "FLOAT DEFAULT 0.0"),
            ("mesin", "status_pembayaran", "VARCHAR(30) DEFAULT 'LUNAS'"),
            ("mesin", "vendor_supplier", "VARCHAR(100)"),
            ("mesin", "no_seri", "VARCHAR(100)"),
            ("mesin", "tanggal_pembelian", "VARCHAR(20)"),
            ("mesin", "garansi_hingga", "VARCHAR(20)"),
            ("mesin", "riwayat_pembayaran", "TEXT DEFAULT '[]'"),
            ("karyawan", "can_login", "BOOLEAN DEFAULT TRUE"),
            # Kolom baru Gudang Kain & Trims
            ("inventory_items", "color_shade_lot", "VARCHAR(50)"),
            ("inventory_items", "width_inch", "FLOAT DEFAULT 58.0"),
            ("inventory_items", "gramasi_gsm", "FLOAT DEFAULT 0.0"),
            ("inventory_items", "min_stock_alert", "FLOAT DEFAULT 50.0"),
            ("inventory_items", "rack_location", "VARCHAR(50) DEFAULT 'GUDANG_UTAMA'"),
            # Kolom baru Meja Potong
            ("cutting_records", "marker_length_yard", "FLOAT DEFAULT 0.0"),
            ("cutting_records", "marker_efficiency_pct", "FLOAT DEFAULT 0.0"),
            ("cutting_records", "gelaran_layers", "INTEGER DEFAULT 1"),
            ("cutting_records", "fabric_waste_yards", "FLOAT DEFAULT 0.0"),
            # Kolom baru Ekspedisi & Pengiriman
            ("shipments", "driver_name", "VARCHAR(100)"),
            ("shipments", "vehicle_plate_no", "VARCHAR(50)"),
            ("shipments", "carton_box_count", "INTEGER DEFAULT 0"),
            ("shipments", "destination_address", "TEXT"),
        ]
        for tbl_name, col_name, col_type in columns_to_add:
            try:
                if is_sqlite:
                    conn.execute(text(f"ALTER TABLE {tbl_name} ADD COLUMN {col_name} {col_type};"))
                else:
                    conn.execute(text(f"ALTER TABLE {tbl_name} ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
            except Exception:
                pass
    except Exception as e:
        print(f"[Database Migration Warning]: Gagal melakukan auto-migration: {e}")


# --- LIFESPAN SEEDER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    auto_migrate_db()
    try:
        db = SessionLocal()
        # Seeder Akun Developer Utama
        dev_exist = db.query(models.Karyawan).filter(models.Karyawan.username == "developer").first()
        if not dev_exist:
            user_dev = models.Karyawan(
                id_karyawan="DEV-001",
                nama="Developer Utama",
                username="developer",
                hashed_password=get_password_hash("DevSecret123!"),
                role="DEVELOPER",
                jabatan="System Developer",
                tanggal_lahir="1995-01-01",
                no_hp="081234567890",
                alamat="Developer Center Nexora",
                status_karyawan="TETAP",
                tanggal_masuk="2026-01-01",
                is_active=True,
                tipe_pay="BULANAN",
                gaji_pokok=15000000,
                tarif_borongan_pcs=0,
                pin="6767",
                total_hadir=30, 
                total_terlambat=0, 
                total_izin=0, 
                total_alpa=0, 
                poin_pelanggaran=0
            )
            db.add(user_dev)
            db.commit()
            print("🟢 Akun Developer 'developer' berhasil dipersiapkan!")

    except Exception as e:
        print(f"⚠️ Info Seeder: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass
    
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

# --- CORS MIDDLEWARE (FLEXIBLE PRODUCTION SUPPORT) ---
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
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

# 🟢 Router Blueprint PT. Chikal Jaya Makmur (7 Fase Terintegrasi)
app.include_router(ppic_so.router)
app.include_router(warehouse_fabric.router)
app.include_router(cutting_prep.router)
app.include_router(wip_subcon.router)
app.include_router(finishing_shipping.router)

# 🟢 Router AI Co-Pilot & Automated Reporting
app.include_router(ai_copilot.router)
app.include_router(email_reports.router)

@app.get("/")
def root_check():
    return {
        "status": "Online",
        "system": "Nexora ERP Engine",
        "version": "1.2.0"
    }