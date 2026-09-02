import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, SessionLocal
import models

# 🟢 1. Helper Security dari core
from core.security import get_password_hash

# 🟢 2. Import Routers (Termasuk audit & modul garment blueprint)
from routers import auth, karyawan, mesin, inventaris, dashboard, audit, payroll
from routers import produksi_master, produksi_output
from routers import ppic_so, warehouse_fabric, cutting_prep, wip_subcon, finishing_shipping
from routers import ai_copilot, email_reports, reports, notifications, data_import

def init_db():
    try:
        models.Base.metadata.create_all(bind=engine)
        print("[Database Init]: Tabel database berhasil diverifikasi.")
    except Exception as e:
        print(f"[Database Error]: Gagal menghubungkan database saat inisialisasi: {e}")

def auto_migrate_db():
    """
    Auto-migrasi ringan: tambahkan kolom model yang belum ada di DB.
    Implementasi kini berbasis introspeksi (core/schema_sync.py) — tidak lagi
    perlu daftar kolom manual yang mudah ketinggalan.
    """
    from core.schema_sync import sync_schema
    sync_schema(engine)


from datetime import date, datetime

def seed_pipeline_data(db):
    try:
        # 1. Seed Partners
        if db.query(models.Partner).count() == 0:
            partners = [
                models.Partner(code="BYR-DELUSI", name="DELUSI FASHION", category="BUYER", address="Bandung", phone="08122334455"),
                models.Partner(code="BYR-WILMER", name="WILMER STUDIOS", category="BUYER", address="Jakarta Barat", phone="08133445566"),
                models.Partner(code="BYR-HAMMER", name="HAMMER DENIM", category="BUYER", address="Bandung", phone="08199887766"),
                models.Partner(code="MKL-ALITIHAD", name="AL-ITIHAD GARMENT", category="MAKLUN_SEWING", address="Cimahi", phone="08122114433"),
                models.Partner(code="WSH-ANUGRAH", name="ANUGRAH WASHING", category="SUBCON_WASHING", address="Kopo Bandung", phone="08155667788"),
                models.Partner(code="PRT-MASKIRNO", name="MAS KIRNO PRINT", category="SUBCON_PRINT", address="Majalaya", phone="08177889900"),
                models.Partner(code="EMB-KODEDE", name="KO DEDE EMBRO", category="SUBCON_EMBROIDERY", address="Moh Toha", phone="08188990011")
            ]
            db.add_all(partners)
            db.commit()
            print("🟢 Seed Partners (Buyers & Subcons) Sukses!")

        # 2. Seed Sales Orders
        so1 = db.query(models.SalesOrder).filter(models.SalesOrder.so_number == "SO-MG260001").first()
        byr_delusi = db.query(models.Partner).filter(models.Partner.name.like("%DELUSI%")).first()
        byr_hammer = db.query(models.Partner).filter(models.Partner.name.like("%HAMMER%")).first()

        if not so1:
            so1 = models.SalesOrder(
                so_number="SO-MG260001",
                buyer_id=byr_delusi.id if byr_delusi else None,
                buyer_po_number="PO-DEL-991",
                customer_pic_name="Ibu Maya (Merchandiser)",
                customer_pic_phone="081234567890",
                customer_email="maya@delusi.com",
                delivery_address="Gudang Distribusi Jakarta Barat",
                style_name="WIND MILD BLACK",
                item_category="LONG JEANS",
                color="BLACK DENIM",
                fabric_type="Denim 13.5 Oz Non-Stretch",
                target_shrinkage_pct=3.5,
                special_instructions="Benang emas 20/2, rivet saku depan, wash medium destroy",
                contract_type="CMT",
                order_qty=500,
                unit_price=35000,
                total_order_value=17500000,
                dp_amount=8000000,
                payment_terms="NET_30",
                tax_ppn_pct=0,
                discount_amount=0,
                size_breakdown_target={"28": 100, "30": 150, "32": 150, "34": 100},
                bom_accessories=[{"item": "Kancing Utama 24L", "qty_per_pcs": 1}, {"item": "Resleting Brass 5\"", "qty_per_pcs": 1}],
                status="SHIPPED",
                order_date=date(2026, 8, 1),
                deadline=date(2026, 8, 25)
            )
            db.add(so1)

        so2 = db.query(models.SalesOrder).filter(models.SalesOrder.so_number == "SO-MG260002").first()
        if not so2:
            so2 = models.SalesOrder(
                so_number="SO-MG260002",
                buyer_id=byr_hammer.id if byr_hammer else None,
                buyer_po_number="PO-HMR-883",
                customer_pic_name="Pak Dimas",
                customer_pic_phone="081987654321",
                customer_email="dimas@hammer.com",
                delivery_address="Gudang Logistik Cikarang Blok C",
                style_name="CARGO VINTAGE WASH",
                item_category="CARGO",
                color="ARMY GREEN",
                fabric_type="Twill Cotton 20s",
                target_shrinkage_pct=2.0,
                special_instructions="Kancing magnet di saku samping, jahitan rantai",
                contract_type="CMT",
                order_qty=300,
                unit_price=28000,
                total_order_value=8400000,
                dp_amount=4000000,
                payment_terms="NET_30",
                tax_ppn_pct=0,
                discount_amount=0,
                size_breakdown_target={"28": 60, "30": 90, "32": 90, "34": 60},
                bom_accessories=[{"item": "Kancing Snap", "qty_per_pcs": 4}],
                status="FINISHING",
                order_date=date(2026, 8, 10),
                deadline=date(2026, 8, 28)
            )
            db.add(so2)
        db.commit()

        # 3. Seed Cutting Records
        if db.query(models.CuttingRecord).count() == 0 and so1 and so2:
            db.add_all([
                models.CuttingRecord(
                    so_id=so1.id,
                    cutting_date=date(2026, 8, 3),
                    marker_code="MRK-WIND-01",
                    layer_count=50,
                    qty_cut=500,
                    size_breakdown_cut={"28": 100, "30": 150, "32": 150, "34": 100},
                    main_fabric_used=650.0,
                    fabric_waste_yards=3.0,
                    notes="Hasil potong rapi, presisi susut 3.5%"
                ),
                models.CuttingRecord(
                    so_id=so2.id,
                    cutting_date=date(2026, 8, 12),
                    marker_code="MRK-CARGO-01",
                    layer_count=30,
                    qty_cut=300,
                    size_breakdown_cut={"28": 60, "30": 90, "32": 90, "34": 60},
                    main_fabric_used=420.0,
                    fabric_waste_yards=15.0,
                    notes="Pemborosan kain perca meja potong terdeteksi"
                )
            ])
            db.commit()

        # 4. Seed WIP Subcon Movements
        if db.query(models.WIPMovement).count() == 0 and so1 and so2:
            mkl_alitihad = db.query(models.Partner).filter(models.Partner.category == "MAKLUN_SEWING").first()
            wsh_anugrah = db.query(models.Partner).filter(models.Partner.category == "SUBCON_WASHING").first()
            
            db.add_all([
                models.WIPMovement(
                    so_id=so1.id,
                    stage_name="SEWING",
                    sequence_order=1,
                    partner_id=mkl_alitihad.id if mkl_alitihad else None,
                    surat_jalan_no="SJ-SEW-001",
                    dispatch_date=date(2026, 8, 5),
                    qty_dispatched=500,
                    received_date=date(2026, 8, 15),
                    qty_received=500,
                    qty_reject=0,
                    balance_discrepancy=0,
                    status="COMPLETED"
                ),
                models.WIPMovement(
                    so_id=so1.id,
                    stage_name="WASHING",
                    sequence_order=2,
                    partner_id=wsh_anugrah.id if wsh_anugrah else None,
                    surat_jalan_no="SJ-WSH-001",
                    dispatch_date=date(2026, 8, 16),
                    qty_dispatched=500,
                    received_date=date(2026, 8, 22),
                    qty_received=500,
                    qty_reject=0,
                    balance_discrepancy=0,
                    status="COMPLETED"
                ),
                models.WIPMovement(
                    so_id=so2.id,
                    stage_name="SEWING",
                    sequence_order=1,
                    partner_id=mkl_alitihad.id if mkl_alitihad else None,
                    surat_jalan_no="SJ-SEW-002",
                    dispatch_date=date(2026, 8, 14),
                    qty_dispatched=300,
                    received_date=date(2026, 8, 24),
                    qty_received=296,
                    qty_reject=0,
                    balance_discrepancy=4,
                    status="DISCREPANCY_FLAG",
                    remarks="Selisih hilang 4 pcs di vendor jahit"
                )
            ])
            db.commit()

        # 5. Seed Piece Rate Finishing Wages
        if db.query(models.PieceRateWage).count() == 0 and so1:
            db.add_all([
                models.PieceRateWage(
                    so_id=so1.id,
                    operation_type="STIM",
                    work_date=date(2026, 8, 23),
                    qty_completed=500,
                    wage_per_piece=500,
                    total_wage=250000,
                    notes="Steam uap rapi oleh Johan"
                ),
                models.PieceRateWage(
                    so_id=so1.id,
                    operation_type="PACKING",
                    work_date=date(2026, 8, 24),
                    qty_completed=495,
                    qty_reject=5,
                    wage_per_piece=600,
                    total_wage=297000,
                    notes="Packing polybag & hangtag"
                )
            ])
            db.commit()

        # 6. Seed Shipment SJP
        if db.query(models.Shipment).count() == 0 and so1:
            sjp1 = models.Shipment(
                so_id=so1.id,
                shipment_date=date(2026, 8, 31),
                surat_jalan_no="SJP-2608.0001",
                driver_id=None,
                driver_name=None,
                vehicle_plate_no=None,
                carton_box_count=15,
                destination_address="Gudang Distribusi Buyer Jakarta Barat",
                total_qty_shipped=495,
                size_breakdown_shipped={"28": 100, "30": 150, "32": 150, "34": 95},
                unit_price=35000,
                total_invoice_amount=17325000,
                invoice_number="INV-2608-001",
                is_invoiced=True,
                remarks="Pengiriman tuntas barang jadi 495 pcs (5 pcs reject finishing)"
            )
            db.add(sjp1)
            db.commit()
            print("🟢 Seed SJP Pengiriman (SJP-2608.0001) Sukses!")

    except Exception as err:
        db.rollback()
        print(f"⚠️ Warning Seeding Pipeline: {err}")


# --- LIFESPAN SEEDER ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    auto_migrate_db()
    _dev_mode = os.getenv("DEV_MODE", "false").strip().lower() == "true"
    try:
        db = SessionLocal()
        # Seeder Akun Developer Utama.
        # Password & PIN diambil dari env (DEV_SEED_PASSWORD / DEV_SEED_PIN).
        # Kalau env kosong: di DEV_MODE dipakai nilai dev default (kemudahan lokal),
        # di produksi pembuatan akun DILEWATI — supaya deploy fresh tidak pernah
        # punya kredensial yang di-hardcode di source.
        dev_exist = db.query(models.Karyawan).filter(models.Karyawan.username == "developer").first()
        if not dev_exist:
            _seed_pw = os.getenv("DEV_SEED_PASSWORD", "").strip() or (
                "DevSecret123!" if _dev_mode else ""
            )
            _seed_pin = os.getenv("DEV_SEED_PIN", "").strip() or (
                "6767" if _dev_mode else ""
            )
            if not _seed_pw:
                print(
                    "⚠️ Akun 'developer' belum ada dan DEV_SEED_PASSWORD tidak diset — "
                    "pembuatan akun dilewati. Set DEV_SEED_PASSWORD (dan opsional "
                    "DEV_SEED_PIN) lalu restart, atau buat akun admin lewat jalur lain."
                )
            else:
                user_dev = models.Karyawan(
                    id_karyawan="DEV-001",
                    nama="Developer Utama",
                    username="developer",
                    hashed_password=get_password_hash(_seed_pw),
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
                    pin=get_password_hash(_seed_pin or _seed_pw),
                    total_hadir=30,
                    total_terlambat=0,
                    total_izin=0,
                    total_alpa=0,
                    poin_pelanggaran=0
                )
                db.add(user_dev)
                db.commit()
                print("🟢 Akun Developer 'developer' berhasil dipersiapkan dari env.")

        # Seed data dummy (SO, partner, upah, dll) HANYA di DEV_MODE.
        # Di produksi seeder ini bisa menanam baris upah operator_id NULL &
        # data palsu setiap boot — endpoint reseed manual pun sudah di-gate
        # DEV_MODE, jadi lifespan harus konsisten.
        if _dev_mode:
            from scripts.seed_production_sql import seed_production_database
            try:
                seed_production_database()
            except Exception as seed_err:
                print(f"⚠️ Seeder Production: {seed_err}")

            seed_pipeline_data(db)
        else:
            print("ℹ️ DEV_MODE=false — seeder data dummy dilewati.")

    except Exception as e:
        print(f"⚠️ Info Seeder: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass

    # Pindai kondisi risiko & buat notifikasi awal (deadline, stok, selisih vendor).
    try:
        from core.alert_engine import run_scan
        scan_db = SessionLocal()
        try:
            res = run_scan(scan_db)
            print(f"🔔 Alert scan: {res['total_created']} notifikasi baru.")
        finally:
            scan_db.close()
    except Exception as alert_err:
        print(f"⚠️ Alert scan gagal: {alert_err}")
    
    yield
    print("🔴 Engine Nexora ERP dimatikan.")


# --- FASTAPI APP ---
app = FastAPI(
    title="Nexora Garment ERP - Enterprise Engine",
    description="Sistem autentikasi, manajemen karyawan, inventaris mesin, dan log kedisiplinan terintegrasi.",
    version="1.2.0",
    lifespan=lifespan
)

import uuid as _uuid

_DEV_MODE = os.getenv("DEV_MODE", "false").strip().lower() == "true"

# --- CORS MIDDLEWARE ---
# Allowlist eksplisit dari env ALLOWED_ORIGINS (dipisah koma). Origin bawaan
# menutup kebutuhan dev + deployment Render. Regex "izinkan semua" dihindari
# karena dikombinasikan allow_credentials=True akan membuka celah CSRF.
_DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://garmen-erp-1.onrender.com",
]
_env_origins = [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = _env_origins or _DEFAULT_ORIGINS

# Lokal saja: izinkan port dev apa pun di localhost tanpa perlu daftar manual.
_dev_origin_regex = r"^http://(localhost|127\.0\.0\.1)(:\d+)?$" if (_DEV_MODE and not _env_origins) else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=_dev_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_id = _uuid.uuid4().hex[:12]
    try:
        print(f"[SERVER ERROR {error_id} on {request.method} {request.url.path}]: {exc}")
    except UnicodeEncodeError:
        print(f"[SERVER ERROR {error_id} on {request.method} {request.url.path}]")
    traceback.print_exc()
    # Jangan bocorkan detail exception ke klien di produksi — cukup error_id
    # yang bisa dicocokkan dengan log server. Di DEV_MODE detail ditampilkan.
    content = {
        "detail": "Terjadi kesalahan internal pada server. Hubungi administrator dengan menyertakan kode error di bawah.",
        "error_id": error_id,
    }
    if _DEV_MODE:
        content["debug"] = str(exc)
        content["path"] = request.url.path
    response = JSONResponse(status_code=500, content=content)
    # Pertahankan header CORS agar frontend tetap bisa membaca body error.
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


# 🟢 3. REGISTRASI ROUTERS
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(karyawan.router)
app.include_router(mesin.router)
app.include_router(inventaris.router)
# 🟢 Router Payroll & Penggajian
app.include_router(payroll.router)

# 🟢 Router Dashboard
app.include_router(dashboard.router)

# 🟠 Router Produksi (LEGACY — modul "Produksi Borongan" lama, digantikan alur
# 6-fase). Navigasi UI-nya sudah ditutup; endpoint /api/produksi/* hanya
# di-mount di DEV_MODE agar tak jadi permukaan tak terpakai di produksi.
# Kode & tabel spk_* dibiarkan sebagai arsip — lihat docs/ANALISIS-MODUL-PRODUKSI.md.
if _DEV_MODE:
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

# 🟢 Router Laporan Agregat (produksi / keuangan / vendor scorecard)
app.include_router(reports.router)

# 🟢 Router Notifikasi & Alert
app.include_router(notifications.router)
app.include_router(data_import.router)

@app.get("/")
def root_check():
    return {
        "status": "Online",
        "system": "Nexora ERP Engine",
        "version": "1.2.1-live"
    }