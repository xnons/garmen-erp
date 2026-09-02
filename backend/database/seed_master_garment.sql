-- =====================================================
-- PT. CHIKAL JAYA MAKMUR (MASTER GARMENT ERP)
-- FULL SCHEMA MIGRATION & BULLETPROOF SEED SCRIPT
-- Target: PostgreSQL / Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------
-- PHASE 0: 100% COMPREHENSIVE AUTO-SCHEMA SYNC (ALL TABLES & COLUMNS)
-- -----------------------------------------------------

-- 1. Partners Table
CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 2. Karyawan Table
CREATE TABLE IF NOT EXISTS karyawan (
    id_karyawan VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    jabatan VARCHAR(100),
    pin VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    status_karyawan VARCHAR(50) DEFAULT 'TETAP',
    tipe_pay VARCHAR(50) DEFAULT 'BULANAN',
    gaji_pokok FLOAT DEFAULT 0.0,
    tarif_borongan_pcs FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS nama VARCHAR(100);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS jabatan VARCHAR(100);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS pin VARCHAR(10);
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS status_karyawan VARCHAR(50) DEFAULT 'TETAP';
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS tipe_pay VARCHAR(50) DEFAULT 'BULANAN';
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS gaji_pokok FLOAT DEFAULT 0.0;
ALTER TABLE karyawan ADD COLUMN IF NOT EXISTS tarif_borongan_pcs FLOAT DEFAULT 0.0;

-- 3. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(50) PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    item_type VARCHAR(30) NOT NULL,
    unit VARCHAR(20) DEFAULT 'YARD',
    unit_price FLOAT DEFAULT 0.0,
    current_stock FLOAT DEFAULT 0.0,
    color_shade_lot VARCHAR(50),
    width_inch FLOAT DEFAULT 58.0,
    gramasi_gsm FLOAT DEFAULT 0.0,
    min_stock_alert FLOAT DEFAULT 50.0,
    rack_location VARCHAR(50) DEFAULT 'GUDANG_UTAMA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_code VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(30);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'YARD';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price FLOAT DEFAULT 0.0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS current_stock FLOAT DEFAULT 0.0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS color_shade_lot VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS width_inch FLOAT DEFAULT 58.0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS gramasi_gsm FLOAT DEFAULT 0.0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_stock_alert FLOAT DEFAULT 50.0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS rack_location VARCHAR(50) DEFAULT 'GUDANG_UTAMA';

-- 4. Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(50) PRIMARY KEY,
    so_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id VARCHAR(50) REFERENCES partners(id),
    buyer_po_number VARCHAR(100),
    customer_pic_name VARCHAR(100),
    customer_pic_phone VARCHAR(50),
    customer_email VARCHAR(100),
    delivery_address TEXT,
    style_name VARCHAR(150) NOT NULL,
    item_category VARCHAR(100) DEFAULT 'LONG JEANS',
    color VARCHAR(50),
    fabric_type VARCHAR(150),
    target_shrinkage_pct FLOAT DEFAULT 0.0,
    special_instructions TEXT,
    contract_type VARCHAR(20) DEFAULT 'CMT',
    order_qty INTEGER DEFAULT 0 NOT NULL,
    unit_price FLOAT DEFAULT 0.0,
    total_order_value FLOAT DEFAULT 0.0,
    dp_amount FLOAT DEFAULT 0.0,
    payment_terms VARCHAR(50) DEFAULT 'NET_30',
    tax_ppn_pct FLOAT DEFAULT 0.0,
    discount_amount FLOAT DEFAULT 0.0,
    size_breakdown_target JSON DEFAULT '{}'::json,
    bom_accessories JSON DEFAULT '[]'::json,
    status VARCHAR(50) DEFAULT 'REGISTERED',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS buyer_id VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS buyer_po_number VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_pic_name VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_pic_phone VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS style_name VARCHAR(150);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS item_category VARCHAR(100) DEFAULT 'LONG JEANS';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS fabric_type VARCHAR(150);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS target_shrinkage_pct FLOAT DEFAULT 0.0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'CMT';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_qty INTEGER DEFAULT 0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS unit_price FLOAT DEFAULT 0.0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS total_order_value FLOAT DEFAULT 0.0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS dp_amount FLOAT DEFAULT 0.0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'NET_30';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tax_ppn_pct FLOAT DEFAULT 0.0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS discount_amount FLOAT DEFAULT 0.0;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS size_breakdown_target JSON DEFAULT '{}'::json;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bom_accessories JSON DEFAULT '[]'::json;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'REGISTERED';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS deadline DATE;

-- 5. Material Receipts & Allocations
CREATE TABLE IF NOT EXISTS material_receipts (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50) REFERENCES inventory_items(id) NOT NULL,
    supplier_id VARCHAR(50) REFERENCES partners(id),
    receipt_date DATE NOT NULL,
    roll_number VARCHAR(50),
    qty_received FLOAT NOT NULL,
    unit VARCHAR(20) DEFAULT 'YARD',
    contract_type VARCHAR(20) DEFAULT 'FOB',
    inspection_status VARCHAR(30) DEFAULT 'PENDING'
);
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS item_id VARCHAR(50);
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50);
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS receipt_date DATE;
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS qty_received FLOAT;
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'YARD';
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'FOB';
ALTER TABLE material_receipts ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(30) DEFAULT 'PENDING';

CREATE TABLE IF NOT EXISTS material_allocations (
    id VARCHAR(50) PRIMARY KEY,
    so_id VARCHAR(50) REFERENCES sales_orders(id) NOT NULL,
    item_id VARCHAR(50) REFERENCES inventory_items(id) NOT NULL,
    dispatch_date DATE NOT NULL,
    qty_issued FLOAT NOT NULL,
    surat_jalan_no VARCHAR(100)
);
ALTER TABLE material_allocations ADD COLUMN IF NOT EXISTS so_id VARCHAR(50);
ALTER TABLE material_allocations ADD COLUMN IF NOT EXISTS item_id VARCHAR(50);
ALTER TABLE material_allocations ADD COLUMN IF NOT EXISTS dispatch_date DATE;
ALTER TABLE material_allocations ADD COLUMN IF NOT EXISTS qty_issued FLOAT;
ALTER TABLE material_allocations ADD COLUMN IF NOT EXISTS surat_jalan_no VARCHAR(100);

-- 6. Cutting Records & Tasks
CREATE TABLE IF NOT EXISTS cutting_records (
    id VARCHAR(50) PRIMARY KEY,
    so_id VARCHAR(50) REFERENCES sales_orders(id) NOT NULL,
    cutting_date DATE NOT NULL,
    operator_id VARCHAR(50) REFERENCES karyawan(id_karyawan),
    qty_cut INTEGER NOT NULL,
    size_breakdown_cut JSON DEFAULT '{}'::json,
    main_fabric_used FLOAT NOT NULL,
    puring_used FLOAT DEFAULT 0.0,
    puring_jala_used FLOAT DEFAULT 0.0,
    main_consumption_rate FLOAT DEFAULT 0.0,
    puring_consumption_rate FLOAT DEFAULT 0.0,
    marker_length_yard FLOAT DEFAULT 0.0,
    marker_efficiency_pct FLOAT DEFAULT 0.0,
    gelaran_layers INTEGER DEFAULT 1,
    fabric_waste_yards FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS so_id VARCHAR(50);
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS cutting_date DATE;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS operator_id VARCHAR(50);
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS qty_cut INTEGER;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS size_breakdown_cut JSON DEFAULT '{}'::json;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS main_fabric_used FLOAT;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS puring_used FLOAT DEFAULT 0.0;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS puring_jala_used FLOAT DEFAULT 0.0;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS main_consumption_rate FLOAT DEFAULT 0.0;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS puring_consumption_rate FLOAT DEFAULT 0.0;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS marker_length_yard FLOAT DEFAULT 0.0;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS marker_efficiency_pct FLOAT DEFAULT 0.0;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS gelaran_layers INTEGER DEFAULT 1;
ALTER TABLE cutting_records ADD COLUMN IF NOT EXISTS fabric_waste_yards FLOAT DEFAULT 0.0;

-- 7. WIP Sequential Pipeline Movements
CREATE TABLE IF NOT EXISTS wip_movements (
    id VARCHAR(50) PRIMARY KEY,
    so_id VARCHAR(50) REFERENCES sales_orders(id) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    partner_id VARCHAR(50) REFERENCES partners(id),
    internal_supervisor_id VARCHAR(50) REFERENCES karyawan(id_karyawan),
    surat_jalan_no VARCHAR(100),
    dispatch_date DATE NOT NULL,
    qty_dispatched INTEGER NOT NULL,
    size_breakdown_dispatched JSON DEFAULT '{}'::json,
    received_date DATE,
    qty_received INTEGER DEFAULT 0,
    qty_reject INTEGER DEFAULT 0,
    size_breakdown_received JSON DEFAULT '{}'::json,
    balance_discrepancy INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'IN_PROCESS',
    remarks TEXT
);
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS so_id VARCHAR(50);
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS stage_name VARCHAR(50);
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 1;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS partner_id VARCHAR(50);
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS internal_supervisor_id VARCHAR(50);
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS surat_jalan_no VARCHAR(100);
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS dispatch_date DATE;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS qty_dispatched INTEGER;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS size_breakdown_dispatched JSON DEFAULT '{}'::json;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS qty_received INTEGER DEFAULT 0;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS qty_reject INTEGER DEFAULT 0;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS size_breakdown_received JSON DEFAULT '{}'::json;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS balance_discrepancy INTEGER DEFAULT 0;
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'IN_PROCESS';
ALTER TABLE wip_movements ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 8. Piece Rate Wages & Shipments
CREATE TABLE IF NOT EXISTS piece_rate_wages (
    id VARCHAR(50) PRIMARY KEY,
    so_id VARCHAR(50) REFERENCES sales_orders(id) NOT NULL,
    operator_id VARCHAR(50) REFERENCES karyawan(id_karyawan),
    operation_type VARCHAR(50) NOT NULL,
    work_date DATE NOT NULL,
    qty_completed INTEGER NOT NULL,
    qty_reject INTEGER DEFAULT 0,
    size_breakdown JSON DEFAULT '{}'::json,
    wage_per_piece FLOAT NOT NULL,
    total_wage FLOAT DEFAULT 0.0,
    notes TEXT
);
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS so_id VARCHAR(50);
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS operator_id VARCHAR(50);
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS work_date DATE;
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS qty_completed INTEGER;
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS qty_reject INTEGER DEFAULT 0;
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS size_breakdown JSON DEFAULT '{}'::json;
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS wage_per_piece FLOAT;
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS total_wage FLOAT DEFAULT 0.0;
ALTER TABLE piece_rate_wages ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY,
    so_id VARCHAR(50) REFERENCES sales_orders(id) NOT NULL,
    shipment_date DATE NOT NULL,
    surat_jalan_no VARCHAR(100) UNIQUE NOT NULL,
    driver_id VARCHAR(50) REFERENCES karyawan(id_karyawan),
    driver_name VARCHAR(100),
    vehicle_plate_no VARCHAR(50),
    carton_box_count INTEGER DEFAULT 0,
    destination_address TEXT,
    total_qty_shipped INTEGER NOT NULL,
    size_breakdown_shipped JSON DEFAULT '{}'::json,
    unit_price FLOAT DEFAULT 0.0,
    total_invoice_amount FLOAT DEFAULT 0.0,
    invoice_number VARCHAR(100),
    is_invoiced BOOLEAN DEFAULT FALSE,
    remarks TEXT
);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS so_id VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipment_date DATE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS surat_jalan_no VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS vehicle_plate_no VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS carton_box_count INTEGER DEFAULT 0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_address TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS total_qty_shipped INTEGER;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS size_breakdown_shipped JSON DEFAULT '{}'::json;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS unit_price FLOAT DEFAULT 0.0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS total_invoice_amount FLOAT DEFAULT 0.0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS is_invoiced BOOLEAN DEFAULT FALSE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS remarks TEXT;


-- -----------------------------------------------------
-- PHASE 1: DATA INGESTION (WITH COMPOUND DUPLICATE GUARDS)
-- -----------------------------------------------------

-- 1. INSERT PARTNERS (BUYERS & SUBCONS)
INSERT INTO partners (id, code, name, category, address, phone)
SELECT * FROM (VALUES
  (gen_random_uuid()::text, 'BYR-ALITIHAD', 'AL-ITIHAD', 'BUYER', 'Bandung, Jawa Barat', '08122334401'),
  (gen_random_uuid()::text, 'BYR-BINTANG', 'BINTANG MADANI', 'BUYER', 'Bandung, Jawa Barat', '08122334402'),
  (gen_random_uuid()::text, 'BYR-CAMO', 'CAMO WARBROKE', 'BUYER', 'Bandung, Jawa Barat', '08122334403'),
  (gen_random_uuid()::text, 'BYR-DELUSI', 'DELUSI', 'BUYER', 'Bandung, Jawa Barat', '08122334404'),
  (gen_random_uuid()::text, 'BYR-FADFAD', 'FADFAD', 'BUYER', 'Bandung, Jawa Barat', '08122334405'),
  (gen_random_uuid()::text, 'BYR-GOTOFAD', 'GOTO FADFAD', 'BUYER', 'Bandung, Jawa Barat', '08122334406'),
  (gen_random_uuid()::text, 'BYR-INSIGHT', 'INSIGHT ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334407'),
  (gen_random_uuid()::text, 'BYR-NEVERSUR', 'NEVER SURENDER', 'BUYER', 'Bandung, Jawa Barat', '08122334408'),
  (gen_random_uuid()::text, 'BYR-OXFOORD', 'OXFOORD', 'BUYER', 'Bandung, Jawa Barat', '08122334409'),
  (gen_random_uuid()::text, 'BYR-PAKDENNY', 'PAKDENNY', 'BUYER', 'Bandung, Jawa Barat', '08122334410'),
  (gen_random_uuid()::text, 'BYR-PAMOKIDS', 'PAMOKIDS', 'BUYER', 'Bandung, Jawa Barat', '08122334411'),
  (gen_random_uuid()::text, 'BYR-PLANET', 'PLANETSUR ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334412'),
  (gen_random_uuid()::text, 'BYR-SEVENTY', 'SEVENTYFOUR', 'BUYER', 'Bandung, Jawa Barat', '08122334413'),
  (gen_random_uuid()::text, 'BYR-SERAGAM', 'SERAGAM', 'BUYER', 'Bandung, Jawa Barat', '08122334414'),
  (gen_random_uuid()::text, 'BYR-SERPARANG', 'SERPARANG', 'BUYER', 'Bandung, Jawa Barat', '08122334415'),
  (gen_random_uuid()::text, 'BYR-SGI', 'SGI', 'BUYER', 'Bandung, Jawa Barat', '08122334416'),
  (gen_random_uuid()::text, 'BYR-SPYDER', 'SPYDERBILT ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334417'),
  (gen_random_uuid()::text, 'BYR-SMBU', 'SMBU', 'BUYER', 'Jakarta Barat', '08122334418'),
  (gen_random_uuid()::text, 'BYR-TRAVEOLOGY', 'TRAVEOLOGY', 'BUYER', 'Bandung, Jawa Barat', '08122334419'),
  (gen_random_uuid()::text, 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334420'),
  (gen_random_uuid()::text, 'BYR-WARNING', 'WARNING', 'BUYER', 'Bandung, Jawa Barat', '08122334421'),
  (gen_random_uuid()::text, 'BYR-WILMER', 'WILMER STUDIOS', 'BUYER', 'Jakarta Barat', '08122334422'),
  (gen_random_uuid()::text, 'MKL-ALITIHAD', 'AL-ITIHAD GARMENT', 'MAKLUN_SEWING', 'Cimahi, Jawa Barat', '08133445501'),
  (gen_random_uuid()::text, 'MKL-PAKADESMD', 'PAK ADE SMD', 'MAKLUN_SEWING', 'Sumedang, Jawa Barat', '08133445502'),
  (gen_random_uuid()::text, 'MKL-PAKADECPR', 'PAK ADE CIPARAY', 'MAKLUN_SEWING', 'Ciparay, Jawa Barat', '08133445503'),
  (gen_random_uuid()::text, 'MKL-ADADANG', 'A DADANG', 'MAKLUN_SEWING', 'Majalaya, Jawa Barat', '08133445504'),
  (gen_random_uuid()::text, 'MKL-PAKAEP', 'PAK AEP TASIK', 'MAKLUN_SEWING', 'Tasikmalaya, Jawa Barat', '08133445505'),
  (gen_random_uuid()::text, 'MKL-PANANA', 'MASTER PA NANA', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445506'),
  (gen_random_uuid()::text, 'MKL-PAKENGKUS', 'PAK ENGKUS', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445507'),
  (gen_random_uuid()::text, 'MKL-PAPIAN', 'MASTER PA PIAN', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445508'),
  (gen_random_uuid()::text, 'MKL-MGMT', 'MANAGEMENT', 'MAKLUN_SEWING', 'Internal Pabrik CJM', '08133445509'),
  (gen_random_uuid()::text, 'WSH-ANUGRAH', 'ANUGRAH WASHING', 'SUBCON_WASHING', 'Kopo, Bandung', '08155667701'),
  (gen_random_uuid()::text, 'WSH-BLESSINDO', 'BLESSINDO WASHING', 'SUBCON_WASHING', 'Cimahi, Jawa Barat', '08155667702'),
  (gen_random_uuid()::text, 'WSH-ELPITO', 'ELPITO WASHING', 'SUBCON_WASHING', 'Bandung, Jawa Barat', '08155667703'),
  (gen_random_uuid()::text, 'WSH-MASTER', 'MASTER LAUNDRY', 'SUBCON_WASHING', 'Cimahi, Jawa Barat', '08155667704'),
  (gen_random_uuid()::text, 'WSH-RITECLEAN', 'RITE CLEAN WASHING', 'SUBCON_WASHING', 'Majalaya, Bandung', '08155667705'),
  (gen_random_uuid()::text, 'PRT-CIPTAJAYA', 'CIPTA JAYA PRINT', 'SUBCON_PRINT', 'Moh Toha, Bandung', '08177889901'),
  (gen_random_uuid()::text, 'PRT-MASKIRNO', 'MAS KIRNO PRINT', 'SUBCON_PRINT', 'Majalaya, Bandung', '08177889902'),
  (gen_random_uuid()::text, 'PRT-PAGANDA', 'PA GANDA PRINT', 'SUBCON_PRINT', 'Ciparay, Bandung', '08177889903'),
  (gen_random_uuid()::text, 'EMB-CJM', 'CJM EMBROIDERY', 'SUBCON_EMBROIDERY', 'Internal Pabrik CJM', '08188990001'),
  (gen_random_uuid()::text, 'EMB-KODEDE', 'KO DEDE EMBRO', 'SUBCON_EMBROIDERY', 'Kopo, Bandung', '08188990002')
) AS v(id, code, name, category, address, phone)
WHERE NOT EXISTS (
  SELECT 1 FROM partners WHERE partners.code = v.code OR partners.name = v.name
);

-- 2. INSERT KARYAWAN
INSERT INTO karyawan (
    id_karyawan, nama, username, hashed_password, role, jabatan, pin, is_active, status_karyawan, tipe_pay, gaji_pokok, tarif_borongan_pcs
)
SELECT * FROM (VALUES
  ('KRY-PPIC-01', 'Khaerulsandi', 'khaerulsandi.ppic', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'PPIC', 'Kepala PPIC & Planning', '123456', TRUE, 'TETAP', 'BULANAN', 5000000, 0),
  ('KRY-QC-01', 'Fitrah', 'fitrah.qc', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'QC_INSPECTOR', 'Quality Control Fabric Inspector', '123456', TRUE, 'TETAP', 'BULANAN', 4500000, 0),
  ('KRY-CUT-01', 'Bu Nani', 'nani.cutting', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'CUTTING_OPERATOR', 'Kepala Meja Potong', '123456', TRUE, 'TETAP', 'BORONGAN', 0, 800),
  ('KRY-PRS-01', 'Silma', 'silma.press', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'PRESS_OPERATOR', 'Operator Press & Numbering', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 400),
  ('KRY-PRS-02', 'Anzani', 'anzani.press', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'PRESS_OPERATOR', 'Operator Press Kain Keras', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 400),
  ('KRY-PRS-03', 'Nazma', 'nazma.press', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'PRESS_OPERATOR', 'Operator Numbering Pola', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 400),
  ('KRY-PRS-04', 'Teni', 'teni.press', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'PRESS_OPERATOR', 'Operator Persiapan Pola', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 400),
  ('KRY-SEW-01', 'Anis', 'anis.sewing', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'LINE_SUPERVISOR', 'Supervisor Lini Jahit Internal', '123456', TRUE, 'TETAP', 'BULANAN', 4500000, 0),
  ('KRY-SEW-02', 'Pa Ato', 'paato.sewing', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'LINE_SUPERVISOR', 'Supervisor Maklun Jahit Luar', '123456', TRUE, 'TETAP', 'BULANAN', 4500000, 0),
  ('KRY-FIN-01', 'Johan', 'johan.fin', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'FINISHING_OPERATOR', 'Operator Steam Uap', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 500),
  ('KRY-FIN-02', 'Ica', 'ica.fin', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'FINISHING_OPERATOR', 'Operator Pasang Kancing & QC', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 400),
  ('KRY-FIN-03', 'Erika', 'erika.fin', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'FINISHING_OPERATOR', 'Operator Buang Benang', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 300),
  ('KRY-FIN-04', 'Desti', 'desti.fin', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'FINISHING_OPERATOR', 'Operator Lipat & Packing', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 400),
  ('KRY-FIN-05', 'Dedi', 'dedi.fin', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'FINISHING_OPERATOR', 'Operator Finishing Khusus', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 500),
  ('KRY-FIN-06', 'Yusuf', 'yusuf.fin', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'FINISHING_OPERATOR', 'Operator Finishing', '123456', TRUE, 'KONTRAK', 'BORONGAN', 0, 500),
  ('KRY-EXP-01', 'Sandi', 'sandi.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Koordinator Pengiriman & Ekspedisi', '123456', TRUE, 'TETAP', 'BULANAN', 4000000, 0),
  ('KRY-EXP-02', 'Pa Kadar', 'kadar.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Driver Distribusi Logistik', '123456', TRUE, 'TETAP', 'BULANAN', 3800000, 0),
  ('KRY-EXP-03', 'Pedro', 'pedro.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Driver Kirim Subcon Washing', '123456', TRUE, 'TETAP', 'BULANAN', 3800000, 0),
  ('KRY-EXP-04', 'Pa Ujang', 'ujang.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Driver Pengiriman SJP', '123456', TRUE, 'TETAP', 'BULANAN', 3800000, 0),
  ('KRY-EXP-05', 'Bian', 'bian.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Driver Logistik Bahan', '123456', TRUE, 'TETAP', 'BULANAN', 3800000, 0),
  ('KRY-EXP-06', 'Ronny', 'ronny.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Driver Distribusi Kain', '123456', TRUE, 'TETAP', 'BULANAN', 3800000, 0),
  ('KRY-EXP-07', 'Arendi', 'arendi.driver', '$2b$12$4417iL1B4XWqjPkWbI9z/eR0H/fD6kL3lA9V3wZ0yW6nJ3kX1yC.y', 'EXPEDITION_DRIVER', 'Driver Ekspedisi Buyer', '123456', TRUE, 'TETAP', 'BULANAN', 3800000, 0)
) AS v(id_karyawan, nama, username, hashed_password, role, jabatan, pin, is_active, status_karyawan, tipe_pay, gaji_pokok, tarif_borongan_pcs)
WHERE NOT EXISTS (
  SELECT 1 FROM karyawan WHERE karyawan.username = v.username OR karyawan.id_karyawan = v.id_karyawan
);

-- 3. INSERT INVENTORY ITEMS
INSERT INTO inventory_items (id, item_code, description, item_type, unit, unit_price, current_stock)
SELECT * FROM (VALUES
  (gen_random_uuid()::text, 'MG-2604-BH0001', 'PURING PUTIH 01 WARNING', 'PURING', 'YARD', 14000.0, 500.0),
  (gen_random_uuid()::text, 'MG-2604-BH0002', 'PETRINA WHITE', 'FABRIC_MAIN', 'YARD', 31000.0, 1200.0),
  (gen_random_uuid()::text, 'MG-2604-BH0003', 'PETRINA BLACK', 'FABRIC_MAIN', 'YARD', 31000.0, 1500.0),
  (gen_random_uuid()::text, 'MG-2604-BH0004', 'RISTER', 'FABRIC_MAIN', 'YARD', 53000.0, 800.0),
  (gen_random_uuid()::text, 'MG-2604-BH0005', 'DEALOVA SALUR KECIL', 'FABRIC_MAIN', 'YARD', 28000.0, 600.0),
  (gen_random_uuid()::text, 'MG-2604-BH0006', 'DEALOVA SALUR SEDANG', 'FABRIC_MAIN', 'YARD', 28000.0, 750.0),
  (gen_random_uuid()::text, 'MG-2604-BH0007', 'SALUR CATEXTILE MEDIUM BLUE', 'FABRIC_MAIN', 'YARD', 32000.0, 900.0),
  (gen_random_uuid()::text, 'MG-2604-BH0008', 'MASTER STRETCH', 'FABRIC_MAIN', 'YARD', 36000.0, 1100.0),
  (gen_random_uuid()::text, 'MG-2604-BH0009', 'PID CYGNUS', 'FABRIC_MAIN', 'YARD', 34000.0, 450.0),
  (gen_random_uuid()::text, 'MG-2604-BH0010', 'SALUR CANDY BLUE', 'FABRIC_MAIN', 'YARD', 29000.0, 620.0),
  (gen_random_uuid()::text, 'MG-2604-BH0011', 'SALUR CANDY RED', 'FABRIC_MAIN', 'YARD', 29000.0, 580.0),
  (gen_random_uuid()::text, 'MG-2604-BH0012', 'PURING POLI KOTAK', 'PURING', 'YARD', 12500.0, 850.0),
  (gen_random_uuid()::text, 'MG-2604-BH0013', 'CANVAS SUEDING KHAKY', 'FABRIC_MAIN', 'YARD', 39000.0, 1300.0),
  (gen_random_uuid()::text, 'MG-2604-BH0014', 'CANVAS SUEDING DARK GREY', 'FABRIC_MAIN', 'YARD', 39000.0, 1400.0),
  (gen_random_uuid()::text, 'MG-2604-BH0015', 'POPLIN STRETCH BLACK', 'FABRIC_MAIN', 'YARD', 25000.0, 2000.0),
  (gen_random_uuid()::text, 'MG-2604-BH0016', 'POPLIN STRETCH WHITE', 'FABRIC_MAIN', 'YARD', 25000.0, 1800.0),
  (gen_random_uuid()::text, 'MG-2604-BH0017', 'LINEN CRINKLE BLACK', 'FABRIC_MAIN', 'YARD', 35000.0, 950.0),
  (gen_random_uuid()::text, 'MG-2604-BH0018', 'LINEN CRINKLE KHAKY', 'FABRIC_MAIN', 'YARD', 35000.0, 850.0),
  (gen_random_uuid()::text, 'MG-2604-BH0019', 'TWILL STRETCH BLACK', 'FABRIC_MAIN', 'YARD', 33000.0, 1250.0),
  (gen_random_uuid()::text, 'MG-2604-BH0020', 'TWILL STRETCH BLUE', 'FABRIC_MAIN', 'YARD', 33000.0, 1150.0)
) AS v(id, item_code, description, item_type, unit, unit_price, current_stock)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items WHERE inventory_items.item_code = v.item_code
);

-- 4. INSERT 20 SALES ORDERS
INSERT INTO sales_orders (id, so_number, buyer_id, style_name, item_category, color, order_qty, status, order_date, contract_type, unit_price, total_order_value, size_breakdown_target)
SELECT 
  gen_random_uuid()::text, v.so_number, 
  (SELECT id FROM partners WHERE partners.name = v.buyer_name OR partners.code = v.buyer_code LIMIT 1),
  v.style_name, v.item_category, v.color, v.order_qty, v.status, 
  v.order_date::date, 'CMT', v.unit_price, v.total_order_value, v.size_breakdown_target::json
FROM (VALUES
  ('SO-MG260001', 'BYR-WILMER', 'WILMER STUDIOS', 'KEMEJA PIQUE SAKU HITAM', 'GARMENT', 'BLACK', 500, 'SHIPPED', '2026-04-01', 35000.0, 17500000.0, '{"28": 100, "30": 150, "32": 150, "34": 100}'),
  ('SO-MG260002', 'BYR-WILMER', 'WILMER STUDIOS', 'KEMEJA PIQUE SAKU PUTIH', 'GARMENT', 'WHITE', 400, 'FINISHING', '2026-04-01', 35000.0, 14000000.0, '{"28": 80, "30": 120, "32": 120, "34": 80}'),
  ('SO-MG260003', 'BYR-INSIGHT', 'INSIGHT ( SMBU )', 'FLANELLA LONG SHIRT', 'GARMENT', 'RED PLAID', 600, 'WASHING', '2026-04-01', 38000.0, 22800000.0, '{"28": 120, "30": 180, "32": 180, "34": 120}'),
  ('SO-MG260004', 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'WIND MILD BLACK', 'LONG JEANS', 'BLACK', 1060, 'SHIPPED', '2026-04-01', 35000.0, 37100000.0, '{"28": 212, "30": 318, "32": 318, "34": 212}'),
  ('SO-MG260005', 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'WIND MILD BLUE', 'LONG JEANS', 'NAVY', 1494, 'CUTTING', '2026-04-01', 35000.0, 52290000.0, '{"28": 300, "30": 450, "32": 450, "34": 294}'),
  ('SO-MG260006', 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'WIND MILD BLUE', 'GARMENT', 'LIGHT BLUE', 300, 'REGISTERED', '2026-04-01', 35000.0, 10500000.0, '{"28": 60, "30": 90, "32": 90, "34": 60}'),
  ('SO-MG260007', 'BYR-WARNING', 'WARNING', 'DECOTTON 2.433', 'GARMENT', 'BLACK', 250, 'SEWING', '2026-04-01', 32000.0, 8000000.0, '{"28": 50, "30": 75, "32": 75, "34": 50}'),
  ('SO-MG260008', 'BYR-WARNING', 'WARNING', 'DECOTTON 2.434', 'GARMENT', 'WHITE', 250, 'SEWING', '2026-04-01', 32000.0, 8000000.0, '{"28": 50, "30": 75, "32": 75, "34": 50}'),
  ('SO-MG260009', 'BYR-WARNING', 'WARNING', 'DECOTTON 2.435', 'GARMENT', 'GREY', 250, 'CUTTING', '2026-04-01', 32000.0, 8000000.0, '{"28": 50, "30": 75, "32": 75, "34": 50}'),
  ('SO-MG260010', 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'SKULLY SHIRT BENDERA PUTIH', 'GARMENT', 'WHITE', 300, 'REGISTERED', '2026-04-01', 30000.0, 9000000.0, '{"28": 60, "30": 90, "32": 90, "34": 60}'),
  ('SO-MG260025', 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'SAMURAI', 'SS KEMEJA', 'BIRU', 1163, 'SHIPPED', '2026-04-13', 32000.0, 37216000.0, '{"28": 232, "30": 348, "32": 348, "34": 235}'),
  ('SO-MG260028', 'BYR-NEVERSUR', 'NEVER SURENDER', 'DENIM BLUE WHISKER', 'LONG JEANS', 'BLUE', 200, 'SHIPPED', '2026-04-21', 38000.0, 7600000.0, '{"28": 40, "30": 60, "32": 60, "34": 40}'),
  ('SO-MG260029', 'BYR-NEVERSUR', 'NEVER SURENDER', 'DENIM BLACK WHISKER', 'LONG JEANS', 'BLACK', 200, 'SHIPPED', '2026-04-21', 38000.0, 7600000.0, '{"28": 40, "30": 60, "32": 60, "34": 40}'),
  ('SO-MG260048', 'BYR-TRAVEOLOGY', 'TRAVEOLOGY', 'JEANS JACKET INDIGO BLUE', 'LONG JAKET', 'INDIGO', 189, 'SHIPPED', '2026-04-28', 45000.0, 8505000.0, '{"28": 38, "30": 56, "32": 56, "34": 39}'),
  ('SO-MG260049', 'BYR-TRAVEOLOGY', 'TRAVEOLOGY', 'JEANS JACKET LIGHT BLUE', 'LONG JAKET', 'LIGHT BLUE', 189, 'SHIPPED', '2026-04-28', 45000.0, 8505000.0, '{"28": 38, "30": 56, "32": 56, "34": 39}'),
  ('SO-MG260062', 'BYR-OXFOORD', 'OXFOORD', 'NEW OUTER BUTTON BEIGE', 'OUTER BUTTON', 'BEIGE', 166, 'SHIPPED', '2026-05-11', 36000.0, 5976000.0, '{"28": 33, "30": 50, "32": 50, "34": 33}'),
  ('SO-MG260063', 'BYR-OXFOORD', 'OXFOORD', 'NEW OUTER BUTTON DARK GREY', 'OUTER BUTTON', 'DARK GREY', 167, 'SHIPPED', '2026-05-11', 36000.0, 6012000.0, '{"28": 33, "30": 50, "32": 50, "34": 34}'),
  ('SO-MG260064', 'BYR-OXFOORD', 'OXFOORD', 'NEW OUTER BUTTON BLACK', 'OUTER BUTTON', 'BLACK', 164, 'SHIPPED', '2026-05-11', 36000.0, 5904000.0, '{"28": 33, "30": 49, "32": 49, "34": 33}'),
  ('SO-MG260076', 'BYR-WARNING', 'WARNING', 'ARVYN LN#1 18', 'SS KEMEJA', 'BLACK', 120, 'SHIPPED', '2026-05-20', 33000.0, 3960000.0, '{"28": 24, "30": 36, "32": 36, "34": 24}'),
  ('SO-MG260078', 'BYR-WARNING', 'WARNING', 'SKIVE LN#5 REG-FIT', 'SS KEMEJA', 'BROWN', 78, 'FINISHING', '2026-05-20', 33000.0, 2574000.0, '{"28": 15, "30": 24, "32": 24, "34": 15}')
) AS v(so_number, buyer_code, buyer_name, style_name, item_category, color, order_qty, status, order_date, unit_price, total_order_value, size_breakdown_target)
WHERE NOT EXISTS (
  SELECT 1 FROM sales_orders WHERE sales_orders.so_number = v.so_number
);

-- 5. INSERT MATERIAL RECEIPTS & ALLOCATIONS
INSERT INTO material_receipts (id, item_id, supplier_id, receipt_date, roll_number, qty_received, unit, contract_type, inspection_status)
SELECT 
  gen_random_uuid()::text, 
  (SELECT id FROM inventory_items WHERE item_code = v.item_code LIMIT 1),
  (SELECT id FROM partners WHERE category = 'BUYER' LIMIT 1),
  v.receipt_date::date, v.roll_number, v.qty_received, 'YARD', 'FOB', 'PASS'
FROM (VALUES
  ('MG-2604-BH0001', '2026-04-02', 'ROLL-2604-001', 500.0),
  ('MG-2604-BH0002', '2026-04-03', 'ROLL-2604-002', 800.0),
  ('MG-2604-BH0003', '2026-04-03', 'ROLL-2604-003', 1500.0)
) AS v(item_code, receipt_date, roll_number, qty_received)
WHERE NOT EXISTS (
  SELECT 1 FROM material_receipts WHERE material_receipts.roll_number = v.roll_number
);

INSERT INTO material_allocations (id, so_id, item_id, dispatch_date, qty_issued, surat_jalan_no)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1),
  (SELECT id FROM inventory_items WHERE item_code = v.item_code LIMIT 1),
  v.dispatch_date::date, v.qty_issued, v.surat_jalan_no
FROM (VALUES
  ('SO-MG260004', 'MG-2604-BH0001', '2026-04-04', 250.0, 'SJ-MAT-2604.01'),
  ('SO-MG260005', 'MG-2604-BH0002', '2026-04-04', 350.0, 'SJ-MAT-2604.02')
) AS v(so_number, item_code, dispatch_date, qty_issued, surat_jalan_no)
WHERE EXISTS (SELECT 1 FROM sales_orders WHERE sales_orders.so_number = v.so_number)
AND NOT EXISTS (
  SELECT 1 FROM material_allocations WHERE material_allocations.surat_jalan_no = v.surat_jalan_no
);

-- 6. INSERT CUTTING LOGS & PREP TASKS
INSERT INTO cutting_records (id, so_id, cutting_date, operator_id, qty_cut, size_breakdown_cut, main_fabric_used, puring_used, main_consumption_rate, puring_consumption_rate, gelaran_layers, fabric_waste_yards)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1),
  v.cutting_date::date, 'KRY-CUT-01', v.qty_cut, v.size_breakdown_cut::json,
  v.main_fabric_used, v.puring_used, 1.3, 0.2, v.gelaran_layers, v.fabric_waste_yards
FROM (VALUES
  ('SO-MG260001', '2026-04-02', 500, '{"28": 100, "30": 150, "32": 150, "34": 100}', 650.0, 100.0, 50, 3.0),
  ('SO-MG260002', '2026-04-03', 400, '{"28": 80, "30": 120, "32": 120, "34": 80}', 520.0, 80.0, 40, 2.5),
  ('SO-MG260003', '2026-04-04', 600, '{"28": 120, "30": 180, "32": 180, "34": 120}', 780.0, 120.0, 60, 4.0),
  ('SO-MG260004', '2026-04-05', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}', 1378.0, 212.0, 50, 5.0),
  ('SO-MG260005', '2026-04-07', 1494, '{"28": 300, "30": 450, "32": 450, "34": 294}', 1942.2, 298.8, 60, 8.0),
  ('SO-MG260007', '2026-04-08', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}', 325.0, 50.0, 25, 1.5),
  ('SO-MG260008', '2026-04-08', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}', 325.0, 50.0, 25, 1.5),
  ('SO-MG260009', '2026-04-09', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}', 325.0, 50.0, 25, 1.5),
  ('SO-MG260025', '2026-04-14', 1163, '{"28": 232, "30": 348, "32": 348, "34": 235}', 1511.9, 232.6, 60, 6.0),
  ('SO-MG260028', '2026-04-22', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', 260.0, 40.0, 20, 1.0),
  ('SO-MG260029', '2026-04-22', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', 260.0, 40.0, 20, 1.0),
  ('SO-MG260048', '2026-04-29', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', 245.7, 37.8, 20, 1.0),
  ('SO-MG260049', '2026-04-29', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', 245.7, 37.8, 20, 1.0),
  ('SO-MG260062', '2026-05-12', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}', 215.8, 33.2, 18, 1.0),
  ('SO-MG260063', '2026-05-12', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}', 217.1, 33.4, 18, 1.0),
  ('SO-MG260064', '2026-05-12', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}', 213.2, 32.8, 18, 1.0),
  ('SO-MG260076', '2026-05-21', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}', 156.0, 24.0, 15, 0.8),
  ('SO-MG260078', '2026-05-21', 78, '{"28": 15, "30": 24, "32": 24, "34": 15}', 101.4, 15.6, 10, 0.5)
) AS v(so_number, cutting_date, qty_cut, size_breakdown_cut, main_fabric_used, puring_used, gelaran_layers, fabric_waste_yards)
WHERE EXISTS (SELECT 1 FROM sales_orders WHERE sales_orders.so_number = v.so_number)
AND NOT EXISTS (
  SELECT 1 FROM cutting_records 
  WHERE cutting_records.so_id = (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1)
);

-- 7. INSERT WIP MOVEMENTS (SEWING & WASHING)
INSERT INTO wip_movements (id, so_id, stage_name, sequence_order, partner_id, internal_supervisor_id, surat_jalan_no, dispatch_date, qty_dispatched, size_breakdown_dispatched, received_date, qty_received, qty_reject, size_breakdown_received, balance_discrepancy, status)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1),
  v.stage_name, v.sequence_order,
  (SELECT id FROM partners WHERE name = v.partner_name LIMIT 1),
  'KRY-SEW-01', v.surat_jalan_no, v.dispatch_date::date, v.qty_dispatched, v.sz::json,
  v.received_date::date, v.qty_received, 0, v.sz::json, 0, v.status
FROM (VALUES
  ('SO-MG260001', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0001', '2026-04-03', 500, '{"28": 100, "30": 150, "32": 150, "34": 100}', '2026-04-12', 500, 'COMPLETED'),
  ('SO-MG260001', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0001', '2026-04-13', 500, '{"28": 100, "30": 150, "32": 150, "34": 100}', '2026-04-18', 500, 'COMPLETED'),
  ('SO-MG260002', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0002', '2026-04-04', 400, '{"28": 80, "30": 120, "32": 120, "34": 80}', '2026-04-14', 400, 'COMPLETED'),
  ('SO-MG260002', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0002', '2026-04-15', 400, '{"28": 80, "30": 120, "32": 120, "34": 80}', '2026-04-20', 400, 'COMPLETED'),
  ('SO-MG260003', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0003', '2026-04-05', 600, '{"28": 120, "30": 180, "32": 180, "34": 120}', '2026-04-16', 600, 'COMPLETED'),
  ('SO-MG260003', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0003', '2026-04-17', 600, '{"28": 120, "30": 180, "32": 180, "34": 120}', '2026-04-23', 600, 'COMPLETED'),
  ('SO-MG260004', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-2604.01', '2026-04-08', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}', '2026-04-18', 1060, 'COMPLETED'),
  ('SO-MG260004', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-2604.01', '2026-04-19', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}', '2026-04-25', 1060, 'COMPLETED'),
  ('SO-MG260025', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0025', '2026-04-15', 1163, '{"28": 232, "30": 348, "32": 348, "34": 235}', '2026-04-26', 1163, 'COMPLETED'),
  ('SO-MG260025', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0025', '2026-04-27', 1163, '{"28": 232, "30": 348, "32": 348, "34": 235}', '2026-05-03', 1163, 'COMPLETED'),
  ('SO-MG260028', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0028', '2026-04-23', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', '2026-04-30', 200, 'COMPLETED'),
  ('SO-MG260028', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0028', '2026-05-01', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', '2026-05-06', 200, 'COMPLETED'),
  ('SO-MG260029', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0029', '2026-04-23', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', '2026-04-30', 200, 'COMPLETED'),
  ('SO-MG260029', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0029', '2026-05-01', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', '2026-05-06', 200, 'COMPLETED'),
  ('SO-MG260048', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0048', '2026-04-30', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', '2026-05-08', 189, 'COMPLETED'),
  ('SO-MG260048', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0048', '2026-05-09', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', '2026-05-15', 189, 'COMPLETED'),
  ('SO-MG260049', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0049', '2026-04-30', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', '2026-05-08', 189, 'COMPLETED'),
  ('SO-MG260049', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0049', '2026-05-09', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', '2026-05-15', 189, 'COMPLETED'),
  ('SO-MG260062', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0062', '2026-05-13', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}', '2026-05-20', 166, 'COMPLETED'),
  ('SO-MG260062', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0062', '2026-05-21', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}', '2026-05-26', 166, 'COMPLETED'),
  ('SO-MG260063', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0063', '2026-05-13', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}', '2026-05-20', 167, 'COMPLETED'),
  ('SO-MG260063', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0063', '2026-05-21', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}', '2026-05-26', 167, 'COMPLETED'),
  ('SO-MG260064', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0064', '2026-05-13', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}', '2026-05-20', 164, 'COMPLETED'),
  ('SO-MG260064', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0064', '2026-05-21', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}', '2026-05-26', 164, 'COMPLETED'),
  ('SO-MG260076', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0076', '2026-05-22', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}', '2026-05-28', 120, 'COMPLETED'),
  ('SO-MG260076', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0076', '2026-05-29', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}', '2026-06-03', 120, 'COMPLETED'),
  ('SO-MG260078', 'SEWING', 1, 'AL-ITIHAD GARMENT', 'SJ-SEW-0078', '2026-05-22', 78, '{"28": 15, "30": 24, "32": 24, "34": 15}', '2026-05-28', 78, 'COMPLETED'),
  ('SO-MG260078', 'WASHING', 2, 'ANUGRAH WASHING', 'SJ-WSH-0078', '2026-05-29', 78, '{"28": 15, "30": 24, "32": 24, "34": 15}', '2026-06-03', 78, 'COMPLETED')
) AS v(so_number, stage_name, sequence_order, partner_name, surat_jalan_no, dispatch_date, qty_dispatched, sz, received_date, qty_received, status)
WHERE EXISTS (SELECT 1 FROM sales_orders WHERE sales_orders.so_number = v.so_number)
AND NOT EXISTS (
  SELECT 1 FROM wip_movements 
  WHERE wip_movements.surat_jalan_no = v.surat_jalan_no
);

-- 8. INSERT PIECE RATE WAGES & SHIPMENTS
INSERT INTO piece_rate_wages (id, so_id, operator_id, operation_type, work_date, qty_completed, qty_reject, size_breakdown, wage_per_piece, total_wage, notes)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1),
  v.operator_id, v.operation_type, v.work_date::date, v.qty_completed, v.qty_reject, v.sz::json,
  v.wage_per_piece, v.total_wage, v.notes
FROM (VALUES
  ('SO-MG260001', 'KRY-FIN-01', 'STIM', '2026-04-20', 500, 0, '{"28": 100, "30": 150, "32": 150, "34": 100}', 500.0, 250000.0, 'Steam uap Johan'),
  ('SO-MG260001', 'KRY-FIN-02', 'KANCING', '2026-04-21', 500, 0, '{"28": 100, "30": 150, "32": 150, "34": 100}', 400.0, 200000.0, 'Pasang kancing Ica'),
  ('SO-MG260001', 'KRY-FIN-04', 'PACKING', '2026-04-22', 495, 5, '{"28": 100, "30": 150, "32": 150, "34": 95}', 400.0, 198000.0, 'Lipat Desti'),
  ('SO-MG260004', 'KRY-FIN-01', 'STIM', '2026-04-26', 1060, 0, '{"28": 212, "30": 318, "32": 318, "34": 212}', 500.0, 530000.0, 'Steam uap Johan'),
  ('SO-MG260004', 'KRY-FIN-02', 'KANCING', '2026-04-27', 1060, 0, '{"28": 212, "30": 318, "32": 318, "34": 212}', 400.0, 424000.0, 'Pasang kancing Ica'),
  ('SO-MG260004', 'KRY-FIN-04', 'PACKING', '2026-04-28', 1055, 5, '{"28": 212, "30": 318, "32": 318, "34": 207}', 400.0, 422000.0, 'Packing Desti'),
  ('SO-MG260025', 'KRY-FIN-01', 'STIM', '2026-05-04', 1163, 0, '{"28": 232, "30": 348, "32": 348, "34": 235}', 500.0, 581500.0, 'Steam Johan'),
  ('SO-MG260025', 'KRY-FIN-04', 'PACKING', '2026-05-05', 1160, 3, '{"28": 232, "30": 348, "32": 348, "34": 232}', 400.0, 464000.0, 'Packing Desti')
) AS v(so_number, operator_id, operation_type, work_date, qty_completed, qty_reject, sz, wage_per_piece, total_wage, notes)
WHERE EXISTS (SELECT 1 FROM sales_orders WHERE sales_orders.so_number = v.so_number)
  -- Idempoten: jangan sisipkan ulang baris demo yang sama kalau seed dijalankan lagi.
  AND NOT EXISTS (
    SELECT 1 FROM piece_rate_wages w2
    WHERE w2.so_id = (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1)
      AND w2.operator_id = v.operator_id
      AND w2.operation_type = v.operation_type
      AND w2.work_date = v.work_date::date
  );

INSERT INTO shipments (id, so_id, shipment_date, surat_jalan_no, driver_id, driver_name, vehicle_plate_no, carton_box_count, destination_address, total_qty_shipped, size_breakdown_shipped, unit_price, total_invoice_amount, invoice_number, is_invoiced, remarks)
SELECT 
  gen_random_uuid()::text,
  (SELECT id FROM sales_orders WHERE so_number = v.so_number LIMIT 1),
  v.shipment_date::date, v.surat_jalan_no, 'KRY-EXP-01', 'Sandi (Ekspedisi)', 'D 8821 CJM',
  v.carton_box_count, v.destination_address, v.total_qty_shipped, v.sz::json,
  v.unit_price, v.total_invoice_amount, v.invoice_number, TRUE, v.remarks
FROM (VALUES
  ('SO-MG260001', '2026-04-25', 'SJP-2604.0001', 15, 'Gudang Distribusi WILMER Jakarta', 495, '{"28": 100, "30": 150, "32": 150, "34": 95}', 35000.0, 17325000.0, 'INV-2604-0001', 'Pengiriman tuntas 495 pcs.'),
  ('SO-MG260004', '2026-04-30', 'SJP-2604.0004', 35, 'Gudang Distribusi VOXFLY Jakarta Barat', 1055, '{"28": 212, "30": 318, "32": 318, "34": 207}', 35000.0, 36925000.0, 'INV-2604-0004', 'Pengiriman tuntas 1.055 pcs dengan SJP Resmi Sandi.'),
  ('SO-MG260025', '2026-05-06', 'SJP-2604.0025', 38, 'Gudang SMBU Jakarta Barat', 1160, '{"28": 232, "30": 348, "32": 348, "34": 232}', 32000.0, 37120000.0, 'INV-2604-0025', 'Pengiriman tuntas 1.160 pcs.'),
  ('SO-MG260028', '2026-05-08', 'SJP-2604.0028', 7, 'Gudang Never Surrender Bandung', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', 38000.0, 7600000.0, 'INV-2604-0028', 'Pengiriman tuntas 200 pcs.'),
  ('SO-MG260029', '2026-05-08', 'SJP-2604.0029', 7, 'Gudang Never Surrender Bandung', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}', 38000.0, 7600000.0, 'INV-2604-0029', 'Pengiriman tuntas 200 pcs.'),
  ('SO-MG260048', '2026-05-18', 'SJP-2604.0048', 6, 'Gudang Traveology Bandung', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', 45000.0, 8505000.0, 'INV-2604-0048', 'Pengiriman tuntas 189 pcs.'),
  ('SO-MG260049', '2026-05-18', 'SJP-2604.0049', 6, 'Gudang Traveology Bandung', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}', 45000.0, 8505000.0, 'INV-2604-0049', 'Pengiriman tuntas 189 pcs.'),
  ('SO-MG260062', '2026-05-28', 'SJP-2604.0062', 5, 'Gudang Oxfoord Bandung', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}', 36000.0, 5976000.0, 'INV-2604-0062', 'Pengiriman tuntas 166 pcs.'),
  ('SO-MG260063', '2026-05-28', 'SJP-2604.0063', 5, 'Gudang Oxfoord Bandung', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}', 36000.0, 6012000.0, 'INV-2604-0063', 'Pengiriman tuntas 167 pcs.'),
  ('SO-MG260064', '2026-05-28', 'SJP-2604.0064', 5, 'Gudang Oxfoord Bandung', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}', 36000.0, 5904000.0, 'INV-2604-0064', 'Pengiriman tuntas 164 pcs.'),
  ('SO-MG260076', '2026-06-05', 'SJP-2604.0076', 4, 'Gudang Warning Bandung', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}', 33000.0, 3960000.0, 'INV-2604-0076', 'Pengiriman tuntas 120 pcs.')
) AS v(so_number, shipment_date, surat_jalan_no, carton_box_count, destination_address, total_qty_shipped, sz, unit_price, total_invoice_amount, invoice_number, remarks)
WHERE EXISTS (SELECT 1 FROM sales_orders WHERE sales_orders.so_number = v.so_number)
AND NOT EXISTS (
  SELECT 1 FROM shipments 
  WHERE shipments.surat_jalan_no = v.surat_jalan_no
);
