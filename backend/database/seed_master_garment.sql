-- =====================================================
-- PT. CHIKAL JAYA MAKMUR (MASTER GARMENT ERP)
-- CLEANED, NORMALIZED & PRODUCTION-READY SEED DATA
-- Target: PostgreSQL / Supabase
-- =====================================================

-- 0. EXTENSION & INDEX CHECK
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_name_uniq ON partners(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_code_uniq ON inventory_items(item_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_orders_so_num_uniq ON sales_orders(so_number);

-- 1. INSERT PARTNERS (BUYERS, MAKLUN & SUBCONS)
INSERT INTO partners (id, code, name, category, address, phone) VALUES
-- Buyers
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-ALITIHAD', 'AL-ITIHAD', 'BUYER', 'Bandung, Jawa Barat', '08122334401'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-BINTANG', 'BINTANG MADANI', 'BUYER', 'Bandung, Jawa Barat', '08122334402'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-CAMO', 'CAMO WARBROKE', 'BUYER', 'Bandung, Jawa Barat', '08122334403'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-DELUSI', 'DELUSI', 'BUYER', 'Bandung, Jawa Barat', '08122334404'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-FADFAD', 'FADFAD', 'BUYER', 'Bandung, Jawa Barat', '08122334405'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-GOTOFAD', 'GOTO FADFAD', 'BUYER', 'Bandung, Jawa Barat', '08122334406'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-INSIGHT', 'INSIGHT ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334407'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-NEVERSUR', 'NEVER SURENDER', 'BUYER', 'Bandung, Jawa Barat', '08122334408'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-OXFOORD', 'OXFOORD', 'BUYER', 'Bandung, Jawa Barat', '08122334409'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-PAKDENNY', 'PAKDENNY', 'BUYER', 'Bandung, Jawa Barat', '08122334410'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-PAMOKIDS', 'PAMOKIDS', 'BUYER', 'Bandung, Jawa Barat', '08122334411'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-PLANET', 'PLANETSUR ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334412'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-SEVENTY', 'SEVENTYFOUR', 'BUYER', 'Bandung, Jawa Barat', '08122334413'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-SERAGAM', 'SERAGAM', 'BUYER', 'Bandung, Jawa Barat', '08122334414'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-SERPARANG', 'SERPARANG', 'BUYER', 'Bandung, Jawa Barat', '08122334415'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-SGI', 'SGI', 'BUYER', 'Bandung, Jawa Barat', '08122334416'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-SPYDER', 'SPYDERBILT ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334417'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-SMBU', 'SMBU', 'BUYER', 'Jakarta Barat', '08122334418'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-TRAVEOLOGY', 'TRAVEOLOGY', 'BUYER', 'Bandung, Jawa Barat', '08122334419'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-VOXFLY', 'VOXFLY ( SMBU )', 'BUYER', 'Jakarta Barat', '08122334420'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-WARNING', 'WARNING', 'BUYER', 'Bandung, Jawa Barat', '08122334421'),
(COALESCE(NULL, gen_random_uuid()::text), 'BYR-WILMER', 'WILMER STUDIOS', 'BUYER', 'Jakarta Barat', '08122334422'),

-- Maklun Sewing
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-ALITIHAD', 'AL-ITIHAD GARMENT', 'MAKLUN_SEWING', 'Cimahi, Jawa Barat', '08133445501'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-PAKADESMD', 'PAK ADE SMD', 'MAKLUN_SEWING', 'Sumedang, Jawa Barat', '08133445502'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-PAKADECPR', 'PAK ADE CIPARAY', 'MAKLUN_SEWING', 'Ciparay, Jawa Barat', '08133445503'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-ADADANG', 'A DADANG', 'MAKLUN_SEWING', 'Majalaya, Jawa Barat', '08133445504'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-PAKAEP', 'PAK AEP TASIK', 'MAKLUN_SEWING', 'Tasikmalaya, Jawa Barat', '08133445505'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-PANANA', 'MASTER PA NANA', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445506'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-PAKENGKUS', 'PAK ENGKUS', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445507'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-PAPIAN', 'MASTER PA PIAN', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445508'),
(COALESCE(NULL, gen_random_uuid()::text), 'MKL-MGMT', 'MANAGEMENT', 'MAKLUN_SEWING', 'Internal Pabrik CJM', '08133445509'),

-- Subcon Washing, Print, Embroidery
(COALESCE(NULL, gen_random_uuid()::text), 'WSH-ANUGRAH', 'ANUGRAH WASHING', 'SUBCON_WASHING', 'Kopo, Bandung', '08155667701'),
(COALESCE(NULL, gen_random_uuid()::text), 'WSH-BLESSINDO', 'BLESSINDO WASHING', 'SUBCON_WASHING', 'Cimahi, Jawa Barat', '08155667702'),
(COALESCE(NULL, gen_random_uuid()::text), 'WSH-ELPITO', 'ELPITO WASHING', 'SUBCON_WASHING', 'Bandung, Jawa Barat', '08155667703'),
(COALESCE(NULL, gen_random_uuid()::text), 'WSH-MASTER', 'MASTER LAUNDRY', 'SUBCON_WASHING', 'Cimahi, Jawa Barat', '08155667704'),
(COALESCE(NULL, gen_random_uuid()::text), 'WSH-RITECLEAN', 'RITE CLEAN WASHING', 'SUBCON_WASHING', 'Majalaya, Bandung', '08155667705'),
(COALESCE(NULL, gen_random_uuid()::text), 'PRT-CIPTAJAYA', 'CIPTA JAYA PRINT', 'SUBCON_PRINT', 'Moh Toha, Bandung', '08177889901'),
(COALESCE(NULL, gen_random_uuid()::text), 'PRT-MASKIRNO', 'MAS KIRNO PRINT', 'SUBCON_PRINT', 'Majalaya, Bandung', '08177889902'),
(COALESCE(NULL, gen_random_uuid()::text), 'PRT-PAGANDA', 'PA GANDA PRINT', 'SUBCON_PRINT', 'Ciparay, Bandung', '08177889903'),
(COALESCE(NULL, gen_random_uuid()::text), 'EMB-CJM', 'CJM EMBROIDERY', 'SUBCON_EMBROIDERY', 'Internal Pabrik CJM', '08188990001'),
(COALESCE(NULL, gen_random_uuid()::text), 'EMB-KODEDE', 'KO DEDE EMBRO', 'SUBCON_EMBROIDERY', 'Kopo, Bandung', '08188990002')
ON CONFLICT (name) DO NOTHING;

-- 2. INSERT EMPLOYEES (OPERATIONAL TEAM) INTO TABEL KARYAWAN
-- Default Password: MasterGarment2026!
INSERT INTO karyawan (
    id_karyawan, nama, username, hashed_password, role, jabatan, pin, is_active, status_karyawan, tipe_pay, gaji_pokok, tarif_borongan_pcs
) VALUES
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
ON CONFLICT (username) DO NOTHING;

-- 3. INSERT RAW MATERIAL INVENTORY (FABRICS & PURINGS)
INSERT INTO inventory_items (id, item_code, description, item_type, unit, unit_price, current_stock) VALUES
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0001', 'PURING PUTIH 01 WARNING', 'PURING', 'YARD', 14000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0002', 'PETRINA WHITE', 'FABRIC_MAIN', 'YARD', 31000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0003', 'PETRINA BLACK', 'FABRIC_MAIN', 'YARD', 31000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0004', 'RISTER', 'FABRIC_MAIN', 'YARD', 53000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0005', 'DEALOVA SALUR KECIL', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0006', 'DEALOVA SALUR SEDANG', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0007', 'SALUR CATEXTILE MEDIUM BLUE', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0008', 'MASTER STRETCH', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0009', 'PID CYGNUS', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0010', 'SALUR CANDY BLUE', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0011', 'SALUR CANDY RED', 'FABRIC_MAIN', 'YARD', 0.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0012', 'PURING POLI KOTAK', 'PURING', 'YARD', 12500.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0013', 'CANVAS SUEDING KHAKY', 'FABRIC_MAIN', 'YARD', 39000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0014', 'CANVAS SUEDING DARK GREY', 'FABRIC_MAIN', 'YARD', 39000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0015', 'POPLIN STRETCH BLACK', 'FABRIC_MAIN', 'YARD', 25000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0016', 'POPLIN STRETCH WHITE', 'FABRIC_MAIN', 'YARD', 25000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0017', 'LINEN CRINKLE BLACK', 'FABRIC_MAIN', 'YARD', 35000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0018', 'LINEN CRINKLE KHAKY', 'FABRIC_MAIN', 'YARD', 35000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0019', 'TWILL STRETCH BLACK', 'FABRIC_MAIN', 'YARD', 33000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'MG-2604-BH0020', 'TWILL STRETCH BLUE', 'FABRIC_MAIN', 'YARD', 33000.0, 0.0)
ON CONFLICT (item_code) DO UPDATE SET 
    description = EXCLUDED.description, 
    unit_price = EXCLUDED.unit_price, 
    current_stock = EXCLUDED.current_stock;

-- 4. INSERT MASTER SALES ORDERS
INSERT INTO sales_orders (id, so_number, buyer_id, style_name, item_category, color, order_qty, status, order_date, contract_type, unit_price, total_order_value) VALUES
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260001', (SELECT id FROM partners WHERE name = 'WILMER STUDIOS' LIMIT 1), 'KEMEJA PIQUE SAKU HITAM', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 35000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260002', (SELECT id FROM partners WHERE name = 'WILMER STUDIOS' LIMIT 1), 'KEMEJA PIQUE SAKU PUTIH', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 35000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260003', (SELECT id FROM partners WHERE name = 'INSIGHT ( SMBU )' LIMIT 1), 'FLANELLA LONG SHIRT', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 38000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260004', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'WIND MILD BLACK', 'LONG JEANS', 'BLACK', 1060, 'SHIPPED', '2026-04-01', 'CMT', 35000.0, 37100000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260005', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'WIND MILD BLUE', 'LONG JEANS', 'NAVY', 1494, 'CUTTING', '2026-04-01', 'CMT', 35000.0, 52290000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260006', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'WIND MILD BLUE', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 35000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260007', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'DECOTTON 2.433', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 32000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260008', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'DECOTTON 2.434', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 32000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260009', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'DECOTTON 2.435', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 32000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260010', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'SKULLY SHIRT BENDERA PUTIH', 'GARMENT', '-', 0, 'REGISTERED', '2026-04-01', 'CMT', 30000.0, 0.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260025', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'SAMURAI', 'SS KEMEJA', 'BIRU', 1163, 'SHIPPED', '2026-04-13', 'CMT', 32000.0, 37216000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260028', (SELECT id FROM partners WHERE name = 'NEVER SURENDER' LIMIT 1), 'DENIM BLUE WHISKER', 'LONG JEANS', 'BLUE', 200, 'SHIPPED', '2026-04-21', 'CMT', 38000.0, 7600000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260029', (SELECT id FROM partners WHERE name = 'NEVER SURENDER' LIMIT 1), 'DENIM BLACK WHISKER', 'LONG JEANS', 'BLACK', 200, 'SHIPPED', '2026-04-21', 'CMT', 38000.0, 7600000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260048', (SELECT id FROM partners WHERE name = 'TRAVEOLOGY' LIMIT 1), 'JEANS JACKET INDIGO BLUE', 'LONG JAKET', 'INDIGO', 189, 'SHIPPED', '2026-04-28', 'CMT', 45000.0, 8505000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260049', (SELECT id FROM partners WHERE name = 'TRAVEOLOGY' LIMIT 1), 'JEANS JACKET LIGHT BLUE', 'LONG JAKET', 'LIGHT BLUE', 189, 'SHIPPED', '2026-04-28', 'CMT', 45000.0, 8505000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260062', (SELECT id FROM partners WHERE name = 'OXFOORD' LIMIT 1), 'NEW OUTER BUTTON BEIGE', 'OUTER BUTTON', 'BEIGE', 166, 'SHIPPED', '2026-05-11', 'CMT', 36000.0, 5976000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260063', (SELECT id FROM partners WHERE name = 'OXFOORD' LIMIT 1), 'NEW OUTER BUTTON DARK GREY', 'OUTER BUTTON', 'DARK GREY', 167, 'SHIPPED', '2026-05-11', 'CMT', 36000.0, 6012000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260064', (SELECT id FROM partners WHERE name = 'OXFOORD' LIMIT 1), 'NEW OUTER BUTTON BLACK', 'OUTER BUTTON', 'BLACK', 164, 'SHIPPED', '2026-05-11', 'CMT', 36000.0, 5904000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260076', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'ARVYN LN#1 18', 'SS KEMEJA', 'BLACK', 120, 'SHIPPED', '2026-05-20', 'CMT', 33000.0, 3960000.0),
(COALESCE(NULL, gen_random_uuid()::text), 'SO-MG260078', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'SKIVE LN#5 REG-FIT', 'SS KEMEJA', 'BROWN', 78, 'FINISHING', '2026-05-20', 'CMT', 33000.0, 2574000.0)
ON CONFLICT (so_number) DO NOTHING;
