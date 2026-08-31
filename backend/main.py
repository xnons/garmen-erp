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
            # Kolom baru Sales Order (PPIC)
            ("sales_orders", "buyer_po_number", "VARCHAR(100)"),
            ("sales_orders", "customer_pic_name", "VARCHAR(100)"),
            ("sales_orders", "customer_pic_phone", "VARCHAR(50)"),
            ("sales_orders", "customer_email", "VARCHAR(100)"),
            ("sales_orders", "delivery_address", "TEXT"),
            ("sales_orders", "fabric_type", "VARCHAR(150)"),
            ("sales_orders", "target_shrinkage_pct", "FLOAT DEFAULT 0.0"),
            ("sales_orders", "special_instructions", "TEXT"),
            ("sales_orders", "contract_type", "VARCHAR(20) DEFAULT 'CMT'"),
            ("sales_orders", "total_order_value", "FLOAT DEFAULT 0.0"),
            ("sales_orders", "dp_amount", "FLOAT DEFAULT 0.0"),
            ("sales_orders", "payment_terms", "VARCHAR(50) DEFAULT 'NET_30'"),
            ("sales_orders", "tax_ppn_pct", "FLOAT DEFAULT 0.0"),
            ("sales_orders", "discount_amount", "FLOAT DEFAULT 0.0"),
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
            driver = db.query(models.Karyawan).filter(models.Karyawan.role == "EXPEDITION_DRIVER").first()
            sjp1 = models.Shipment(
                so_id=so1.id,
                shipment_date=date(2026, 8, 31),
                surat_jalan_no="SJP-2608.0001",
                driver_id=driver.id_karyawan if driver else None,
                driver_name="Sandi (Ekspedisi)",
                vehicle_plate_no="B 9821 CJM",
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

        # Seed pipeline data secara otomatis
        from scripts.seed_production_sql import seed_production_database
        try:
            seed_production_database()
        except Exception as seed_err:
            print(f"⚠️ Seeder Production: {seed_err}")
            
        seed_pipeline_data(db)

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

from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"🔥 [CRITICAL SERVER ERROR on {request.method} {request.url.path}]: {exc}")
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": str(exc), "path": request.url.path}
    )
    origin = request.headers.get("origin") or "*"
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
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
        "version": "1.2.1-live"
    }