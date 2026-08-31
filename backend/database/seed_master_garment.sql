-- =====================================================
-- PT. CHIKAL JAYA MAKMUR (MASTER GARMENT ERP)
-- FULL PRODUCTION DATASET (100% EXECUTABLE DI SUPABASE SQL EDITOR)
-- Target: PostgreSQL / Supabase
-- =====================================================

-- 0. ENABLE EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. INSERT PARTNERS (BUYERS, MAKLUN & SUBCONS)
INSERT INTO partners (id, code, name, category, address, phone) VALUES
-- Buyers
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

-- Maklun Sewing
(gen_random_uuid()::text, 'MKL-ALITIHAD', 'AL-ITIHAD GARMENT', 'MAKLUN_SEWING', 'Cimahi, Jawa Barat', '08133445501'),
(gen_random_uuid()::text, 'MKL-PAKADESMD', 'PAK ADE SMD', 'MAKLUN_SEWING', 'Sumedang, Jawa Barat', '08133445502'),
(gen_random_uuid()::text, 'MKL-PAKADECPR', 'PAK ADE CIPARAY', 'MAKLUN_SEWING', 'Ciparay, Jawa Barat', '08133445503'),
(gen_random_uuid()::text, 'MKL-ADADANG', 'A DADANG', 'MAKLUN_SEWING', 'Majalaya, Jawa Barat', '08133445504'),
(gen_random_uuid()::text, 'MKL-PAKAEP', 'PAK AEP TASIK', 'MAKLUN_SEWING', 'Tasikmalaya, Jawa Barat', '08133445505'),
(gen_random_uuid()::text, 'MKL-PANANA', 'MASTER PA NANA', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445506'),
(gen_random_uuid()::text, 'MKL-PAKENGKUS', 'PAK ENGKUS', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445507'),
(gen_random_uuid()::text, 'MKL-PAPIAN', 'MASTER PA PIAN', 'MAKLUN_SEWING', 'Bandung, Jawa Barat', '08133445508'),
(gen_random_uuid()::text, 'MKL-MGMT', 'MANAGEMENT', 'MAKLUN_SEWING', 'Internal Pabrik CJM', '08133445509'),

-- Subcon Washing, Print, Embroidery
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
ON CONFLICT (name) DO NOTHING;

-- 2. INSERT KARYAWAN (OPERATIONAL & FINANCE TEAM)
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
ON CONFLICT (item_code) DO UPDATE SET 
    description = EXCLUDED.description, 
    unit_price = EXCLUDED.unit_price, 
    current_stock = EXCLUDED.current_stock;

-- 4. INSERT MASTER 20 SALES ORDERS
INSERT INTO sales_orders (id, so_number, buyer_id, style_name, item_category, color, order_qty, status, order_date, contract_type, unit_price, total_order_value, size_breakdown_target) VALUES
(gen_random_uuid()::text, 'SO-MG260001', (SELECT id FROM partners WHERE name = 'WILMER STUDIOS' LIMIT 1), 'KEMEJA PIQUE SAKU HITAM', 'GARMENT', 'BLACK', 500, 'SHIPPED', '2026-04-01', 'CMT', 35000.0, 17500000.0, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json),
(gen_random_uuid()::text, 'SO-MG260002', (SELECT id FROM partners WHERE name = 'WILMER STUDIOS' LIMIT 1), 'KEMEJA PIQUE SAKU PUTIH', 'GARMENT', 'WHITE', 400, 'FINISHING', '2026-04-01', 'CMT', 35000.0, 14000000.0, '{"28": 80, "30": 120, "32": 120, "34": 80}'::json),
(gen_random_uuid()::text, 'SO-MG260003', (SELECT id FROM partners WHERE name = 'INSIGHT ( SMBU )' LIMIT 1), 'FLANELLA LONG SHIRT', 'GARMENT', 'RED PLAID', 600, 'WASHING', '2026-04-01', 'CMT', 38000.0, 22800000.0, '{"28": 120, "30": 180, "32": 180, "34": 120}'::json),
(gen_random_uuid()::text, 'SO-MG260004', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'WIND MILD BLACK', 'LONG JEANS', 'BLACK', 1060, 'SHIPPED', '2026-04-01', 'CMT', 35000.0, 37100000.0, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json),
(gen_random_uuid()::text, 'SO-MG260005', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'WIND MILD BLUE', 'LONG JEANS', 'NAVY', 1494, 'CUTTING', '2026-04-01', 'CMT', 35000.0, 52290000.0, '{"28": 300, "30": 450, "32": 450, "34": 294}'::json),
(gen_random_uuid()::text, 'SO-MG260006', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'WIND MILD BLUE', 'GARMENT', 'LIGHT BLUE', 300, 'REGISTERED', '2026-04-01', 'CMT', 35000.0, 10500000.0, '{"28": 60, "30": 90, "32": 90, "34": 60}'::json),
(gen_random_uuid()::text, 'SO-MG260007', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'DECOTTON 2.433', 'GARMENT', 'BLACK', 250, 'SEWING', '2026-04-01', 'CMT', 32000.0, 8000000.0, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json),
(gen_random_uuid()::text, 'SO-MG260008', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'DECOTTON 2.434', 'GARMENT', 'WHITE', 250, 'SEWING', '2026-04-01', 'CMT', 32000.0, 8000000.0, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json),
(gen_random_uuid()::text, 'SO-MG260009', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'DECOTTON 2.435', 'GARMENT', 'GREY', 250, 'CUTTING', '2026-04-01', 'CMT', 32000.0, 8000000.0, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json),
(gen_random_uuid()::text, 'SO-MG260010', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'SKULLY SHIRT BENDERA PUTIH', 'GARMENT', 'WHITE', 300, 'REGISTERED', '2026-04-01', 'CMT', 30000.0, 9000000.0, '{"28": 60, "30": 90, "32": 90, "34": 60}'::json),
(gen_random_uuid()::text, 'SO-MG260025', (SELECT id FROM partners WHERE name = 'VOXFLY ( SMBU )' LIMIT 1), 'SAMURAI', 'SS KEMEJA', 'BIRU', 1163, 'SHIPPED', '2026-04-13', 'CMT', 32000.0, 37216000.0, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json),
(gen_random_uuid()::text, 'SO-MG260028', (SELECT id FROM partners WHERE name = 'NEVER SURENDER' LIMIT 1), 'DENIM BLUE WHISKER', 'LONG JEANS', 'BLUE', 200, 'SHIPPED', '2026-04-21', 'CMT', 38000.0, 7600000.0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json),
(gen_random_uuid()::text, 'SO-MG260029', (SELECT id FROM partners WHERE name = 'NEVER SURENDER' LIMIT 1), 'DENIM BLACK WHISKER', 'LONG JEANS', 'BLACK', 200, 'SHIPPED', '2026-04-21', 'CMT', 38000.0, 7600000.0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json),
(gen_random_uuid()::text, 'SO-MG260048', (SELECT id FROM partners WHERE name = 'TRAVEOLOGY' LIMIT 1), 'JEANS JACKET INDIGO BLUE', 'LONG JAKET', 'INDIGO', 189, 'SHIPPED', '2026-04-28', 'CMT', 45000.0, 8505000.0, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json),
(gen_random_uuid()::text, 'SO-MG260049', (SELECT id FROM partners WHERE name = 'TRAVEOLOGY' LIMIT 1), 'JEANS JACKET LIGHT BLUE', 'LONG JAKET', 'LIGHT BLUE', 189, 'SHIPPED', '2026-04-28', 'CMT', 45000.0, 8505000.0, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json),
(gen_random_uuid()::text, 'SO-MG260062', (SELECT id FROM partners WHERE name = 'OXFOORD' LIMIT 1), 'NEW OUTER BUTTON BEIGE', 'OUTER BUTTON', 'BEIGE', 166, 'SHIPPED', '2026-05-11', 'CMT', 36000.0, 5976000.0, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json),
(gen_random_uuid()::text, 'SO-MG260063', (SELECT id FROM partners WHERE name = 'OXFOORD' LIMIT 1), 'NEW OUTER BUTTON DARK GREY', 'OUTER BUTTON', 'DARK GREY', 167, 'SHIPPED', '2026-05-11', 'CMT', 36000.0, 6012000.0, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json),
(gen_random_uuid()::text, 'SO-MG260064', (SELECT id FROM partners WHERE name = 'OXFOORD' LIMIT 1), 'NEW OUTER BUTTON BLACK', 'OUTER BUTTON', 'BLACK', 164, 'SHIPPED', '2026-05-11', 'CMT', 36000.0, 5904000.0, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json),
(gen_random_uuid()::text, 'SO-MG260076', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'ARVYN LN#1 18', 'SS KEMEJA', 'BLACK', 120, 'SHIPPED', '2026-05-20', 'CMT', 33000.0, 3960000.0, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json),
(gen_random_uuid()::text, 'SO-MG260078', (SELECT id FROM partners WHERE name = 'WARNING' LIMIT 1), 'SKIVE LN#5 REG-FIT', 'SS KEMEJA', 'BROWN', 78, 'FINISHING', '2026-05-20', 'CMT', 33000.0, 2574000.0, '{"28": 15, "30": 24, "32": 24, "34": 15}'::json)
ON CONFLICT (so_number) DO UPDATE SET
    order_qty = EXCLUDED.order_qty,
    status = EXCLUDED.status,
    style_name = EXCLUDED.style_name,
    unit_price = EXCLUDED.unit_price,
    total_order_value = EXCLUDED.total_order_value;

-- 5. INSERT MATERIAL RECEIPTS, INSPECTIONS & ALLOCATIONS
INSERT INTO material_receipts (id, item_id, supplier_id, receipt_date, roll_number, qty_received, unit, contract_type, inspection_status) VALUES
(gen_random_uuid()::text, (SELECT id FROM inventory_items WHERE item_code = 'MG-2604-BH0001' LIMIT 1), (SELECT id FROM partners WHERE category = 'BUYER' LIMIT 1), '2026-04-02', 'ROLL-2604-001', 500.0, 'YARD', 'FOB', 'PASS'),
(gen_random_uuid()::text, (SELECT id FROM inventory_items WHERE item_code = 'MG-2604-BH0002' LIMIT 1), (SELECT id FROM partners WHERE category = 'BUYER' LIMIT 1), '2026-04-03', 'ROLL-2604-002', 800.0, 'YARD', 'FOB', 'PASS'),
(gen_random_uuid()::text, (SELECT id FROM inventory_items WHERE item_code = 'MG-2604-BH0003' LIMIT 1), (SELECT id FROM partners WHERE category = 'BUYER' LIMIT 1), '2026-04-03', 'ROLL-2604-003', 1500.0, 'YARD', 'FOB', 'PASS')
ON CONFLICT DO NOTHING;

INSERT INTO material_allocations (id, so_id, item_id, dispatch_date, qty_issued, surat_jalan_no) VALUES
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), (SELECT id FROM inventory_items WHERE item_code = 'MG-2604-BH0001' LIMIT 1), '2026-04-04', 250.0, 'SJ-MAT-2604.01'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260005' LIMIT 1), (SELECT id FROM inventory_items WHERE item_code = 'MG-2604-BH0002' LIMIT 1), '2026-04-04', 350.0, 'SJ-MAT-2604.02')
ON CONFLICT DO NOTHING;

-- 6. INSERT CUTTING LOGS & PREP TASKS
INSERT INTO cutting_records (id, so_id, cutting_date, operator_id, qty_cut, size_breakdown_cut, main_fabric_used, puring_used, main_consumption_rate, puring_consumption_rate, gelaran_layers, fabric_waste_yards) VALUES
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), '2026-04-02', 'KRY-CUT-01', 500, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, 650.0, 100.0, 1.3, 0.2, 50, 3.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260002' LIMIT 1), '2026-04-03', 'KRY-CUT-01', 400, '{"28": 80, "30": 120, "32": 120, "34": 80}'::json, 520.0, 80.0, 1.3, 0.2, 40, 2.5),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260003' LIMIT 1), '2026-04-04', 'KRY-CUT-01', 600, '{"28": 120, "30": 180, "32": 180, "34": 120}'::json, 780.0, 120.0, 1.3, 0.2, 60, 4.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), '2026-04-05', 'KRY-CUT-01', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 1378.0, 212.0, 1.3, 0.2, 50, 5.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260005' LIMIT 1), '2026-04-07', 'KRY-CUT-01', 1494, '{"28": 300, "30": 450, "32": 450, "34": 294}'::json, 1942.2, 298.8, 1.3, 0.2, 60, 8.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260007' LIMIT 1), '2026-04-08', 'KRY-CUT-01', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json, 325.0, 50.0, 1.3, 0.2, 25, 1.5),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260008' LIMIT 1), '2026-04-08', 'KRY-CUT-01', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json, 325.0, 50.0, 1.3, 0.2, 25, 1.5),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260009' LIMIT 1), '2026-04-09', 'KRY-CUT-01', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json, 325.0, 50.0, 1.3, 0.2, 25, 1.5),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260025' LIMIT 1), '2026-04-14', 'KRY-CUT-01', 1163, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json, 1511.9, 232.6, 1.3, 0.2, 60, 6.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260028' LIMIT 1), '2026-04-22', 'KRY-CUT-01', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 260.0, 40.0, 1.3, 0.2, 20, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260029' LIMIT 1), '2026-04-22', 'KRY-CUT-01', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 260.0, 40.0, 1.3, 0.2, 20, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260048' LIMIT 1), '2026-04-29', 'KRY-CUT-01', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 245.7, 37.8, 1.3, 0.2, 20, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260049' LIMIT 1), '2026-04-29', 'KRY-CUT-01', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 245.7, 37.8, 1.3, 0.2, 20, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260062' LIMIT 1), '2026-05-12', 'KRY-CUT-01', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json, 215.8, 33.2, 1.3, 0.2, 18, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260063' LIMIT 1), '2026-05-12', 'KRY-CUT-01', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json, 217.1, 33.4, 1.3, 0.2, 18, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260064' LIMIT 1), '2026-05-12', 'KRY-CUT-01', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json, 213.2, 32.8, 1.3, 0.2, 18, 1.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260076' LIMIT 1), '2026-05-21', 'KRY-CUT-01', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json, 156.0, 24.0, 1.3, 0.2, 15, 0.8),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260078' LIMIT 1), '2026-05-21', 'KRY-CUT-01', 78, '{"28": 15, "30": 24, "32": 24, "34": 15}'::json, 101.4, 15.6, 1.3, 0.2, 10, 0.5)
ON CONFLICT DO NOTHING;

INSERT INTO cutting_prep_tasks (id, so_id, task_type, operator_id, task_date, qty_done, size_breakdown, piece_rate, total_wage) VALUES
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'NUMBERING', 'KRY-PRS-01', '2026-04-06', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 400.0, 424000.0),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'PRESS', 'KRY-PRS-01', '2026-04-06', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 400.0, 424000.0)
ON CONFLICT DO NOTHING;

-- 7. INSERT WIP MOVEMENTS (DISTRIBUSI SUBCON SEWING & WASHING)
INSERT INTO wip_movements (id, so_id, stage_name, sequence_order, partner_id, internal_supervisor_id, surat_jalan_no, dispatch_date, qty_dispatched, size_breakdown_dispatched, received_date, qty_received, qty_reject, size_breakdown_received, balance_discrepancy, status) VALUES
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0001', '2026-04-03', 500, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, '2026-04-12', 500, 0, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0001', '2026-04-13', 500, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, '2026-04-18', 500, 0, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260002' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0002', '2026-04-04', 400, '{"28": 80, "30": 120, "32": 120, "34": 80}'::json, '2026-04-14', 400, 0, '{"28": 80, "30": 120, "32": 120, "34": 80}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260002' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0002', '2026-04-15', 400, '{"28": 80, "30": 120, "32": 120, "34": 80}'::json, '2026-04-20', 400, 0, '{"28": 80, "30": 120, "32": 120, "34": 80}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260003' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0003', '2026-04-05', 600, '{"28": 120, "30": 180, "32": 180, "34": 120}'::json, '2026-04-16', 600, 0, '{"28": 120, "30": 180, "32": 180, "34": 120}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260003' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0003', '2026-04-17', 600, '{"28": 120, "30": 180, "32": 180, "34": 120}'::json, '2026-04-23', 600, 0, '{"28": 120, "30": 180, "32": 180, "34": 120}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-2604.01', '2026-04-08', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, '2026-04-18', 1060, 0, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-2604.01', '2026-04-19', 1060, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, '2026-04-25', 1060, 0, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260007' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0007', '2026-04-10', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json, NULL, 150, 0, '{"28": 30, "30": 45, "32": 45, "34": 30}'::json, 100, 'IN_PROCESS'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260008' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0008', '2026-04-10', 250, '{"28": 50, "30": 75, "32": 75, "34": 50}'::json, NULL, 200, 0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 50, 'IN_PROCESS'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260025' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0025', '2026-04-15', 1163, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json, '2026-04-26', 1163, 0, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260025' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0025', '2026-04-27', 1163, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json, '2026-05-03', 1163, 0, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260028' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0028', '2026-04-23', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, '2026-04-30', 200, 0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260028' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0028', '2026-05-01', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, '2026-05-06', 200, 0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260029' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0029', '2026-04-23', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, '2026-04-30', 200, 0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260029' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0029', '2026-05-01', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, '2026-05-06', 200, 0, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260048' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0048', '2026-04-30', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, '2026-05-08', 189, 0, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260048' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0048', '2026-05-09', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, '2026-05-15', 189, 0, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260049' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0049', '2026-04-30', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, '2026-05-08', 189, 0, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260049' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0049', '2026-05-09', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, '2026-05-15', 189, 0, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260062' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0062', '2026-05-13', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json, '2026-05-20', 166, 0, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260062' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0062', '2026-05-21', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json, '2026-05-26', 166, 0, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260063' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0063', '2026-05-13', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json, '2026-05-20', 167, 0, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260063' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0063', '2026-05-21', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json, '2026-05-26', 167, 0, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260064' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0064', '2026-05-13', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json, '2026-05-20', 164, 0, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260064' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0064', '2026-05-21', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json, '2026-05-26', 164, 0, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260076' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0076', '2026-05-22', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json, '2026-05-28', 120, 0, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260076' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0076', '2026-05-29', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json, '2026-06-03', 120, 0, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260078' LIMIT 1), 'SEWING', 1, (SELECT id FROM partners WHERE name = 'AL-ITIHAD GARMENT' LIMIT 1), 'KRY-SEW-01', 'SJ-SEW-0078', '2026-05-22', 78, '{"28": 15, "30": 24, "32": 24, "34": 15}'::json, '2026-05-28', 78, 0, '{"28": 15, "30": 24, "32": 24, "34": 15}'::json, 0, 'COMPLETED'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260078' LIMIT 1), 'WASHING', 2, (SELECT id FROM partners WHERE name = 'ANUGRAH WASHING' LIMIT 1), 'KRY-SEW-01', 'SJ-WSH-0078', '2026-05-29', 78, '{"28": 15, "30": 24, "32": 24, "34": 15}'::json, '2026-06-03', 78, 0, '{"28": 15, "30": 24, "32": 24, "34": 15}'::json, 0, 'COMPLETED')
ON CONFLICT DO NOTHING;

-- 8. INSERT FINISHING WAGES & SHIPMENT SJP
INSERT INTO piece_rate_wages (id, so_id, operator_id, operation_type, work_date, qty_completed, qty_reject, size_breakdown, wage_per_piece, total_wage, notes) VALUES
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), 'KRY-FIN-01', 'STIM', '2026-04-20', 500, 0, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, 500.0, 250000.0, 'Steam uap rapi oleh Johan'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), 'KRY-FIN-02', 'KANCING', '2026-04-21', 500, 0, '{"28": 100, "30": 150, "32": 150, "34": 100}'::json, 400.0, 200000.0, 'Pasang kancing oleh Ica'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), 'KRY-FIN-04', 'PACKING', '2026-04-22', 495, 5, '{"28": 100, "30": 150, "32": 150, "34": 95}'::json, 400.0, 198000.0, 'Lipat polybag & hangtag Desti'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'KRY-FIN-01', 'STIM', '2026-04-26', 1060, 0, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 500.0, 530000.0, 'Steam uap rapi oleh Johan'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'KRY-FIN-02', 'KANCING', '2026-04-27', 1060, 0, '{"28": 212, "30": 318, "32": 318, "34": 212}'::json, 400.0, 424000.0, 'Pasang kancing & rivet saku'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), 'KRY-FIN-04', 'PACKING', '2026-04-28', 1055, 5, '{"28": 212, "30": 318, "32": 318, "34": 207}'::json, 400.0, 422000.0, 'Lipat polybag & hangtag (5 pcs reject finishing)'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260025' LIMIT 1), 'KRY-FIN-01', 'STIM', '2026-05-04', 1163, 0, '{"28": 232, "30": 348, "32": 348, "34": 235}'::json, 500.0, 581500.0, 'Steam uap kemeja'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260025' LIMIT 1), 'KRY-FIN-04', 'PACKING', '2026-05-05', 1160, 3, '{"28": 232, "30": 348, "32": 348, "34": 232}'::json, 400.0, 464000.0, 'Packing kemeja samurai')
ON CONFLICT DO NOTHING;

INSERT INTO shipments (id, so_id, shipment_date, surat_jalan_no, driver_id, driver_name, vehicle_plate_no, carton_box_count, destination_address, total_qty_shipped, size_breakdown_shipped, unit_price, total_invoice_amount, invoice_number, is_invoiced, remarks) VALUES
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260001' LIMIT 1), '2026-04-25', 'SJP-2604.0001', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 15, 'Gudang Distribusi WILMER Jakarta', 495, '{"28": 100, "30": 150, "32": 150, "34": 95}'::json, 35000.0, 17325000.0, 'INV-2604-0001', TRUE, 'Pengiriman tuntas 495 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260004' LIMIT 1), '2026-04-30', 'SJP-2604.0004', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 35, 'Gudang Distribusi VOXFLY Jakarta Barat', 1055, '{"28": 212, "30": 318, "32": 318, "34": 207}'::json, 35000.0, 36925000.0, 'INV-2604-0004', TRUE, 'Pengiriman tuntas 1.055 pcs dengan SJP Resmi Sandi.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260025' LIMIT 1), '2026-05-06', 'SJP-2604.0025', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 38, 'Gudang SMBU Jakarta Barat', 1160, '{"28": 232, "30": 348, "32": 348, "34": 232}'::json, 32000.0, 37120000.0, 'INV-2604-0025', TRUE, 'Pengiriman tuntas 1.160 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260028' LIMIT 1), '2026-05-08', 'SJP-2604.0028', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 7, 'Gudang Never Surrender Bandung', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 38000.0, 7600000.0, 'INV-2604-0028', TRUE, 'Pengiriman tuntas 200 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260029' LIMIT 1), '2026-05-08', 'SJP-2604.0029', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 7, 'Gudang Never Surrender Bandung', 200, '{"28": 40, "30": 60, "32": 60, "34": 40}'::json, 38000.0, 7600000.0, 'INV-2604-0029', TRUE, 'Pengiriman tuntas 200 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260048' LIMIT 1), '2026-05-18', 'SJP-2604.0048', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 6, 'Gudang Traveology Bandung', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 45000.0, 8505000.0, 'INV-2604-0048', TRUE, 'Pengiriman tuntas 189 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260049' LIMIT 1), '2026-05-18', 'SJP-2604.0049', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 6, 'Gudang Traveology Bandung', 189, '{"28": 38, "30": 56, "32": 56, "34": 39}'::json, 45000.0, 8505000.0, 'INV-2604-0049', TRUE, 'Pengiriman tuntas 189 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260062' LIMIT 1), '2026-05-28', 'SJP-2604.0062', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 5, 'Gudang Oxfoord Bandung', 166, '{"28": 33, "30": 50, "32": 50, "34": 33}'::json, 36000.0, 5976000.0, 'INV-2604-0062', TRUE, 'Pengiriman tuntas 166 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260063' LIMIT 1), '2026-05-28', 'SJP-2604.0063', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 5, 'Gudang Oxfoord Bandung', 167, '{"28": 33, "30": 50, "32": 50, "34": 34}'::json, 36000.0, 6012000.0, 'INV-2604-0063', TRUE, 'Pengiriman tuntas 167 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260064' LIMIT 1), '2026-05-28', 'SJP-2604.0064', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 5, 'Gudang Oxfoord Bandung', 164, '{"28": 33, "30": 49, "32": 49, "34": 33}'::json, 36000.0, 5904000.0, 'INV-2604-0064', TRUE, 'Pengiriman tuntas 164 pcs.'),
(gen_random_uuid()::text, (SELECT id FROM sales_orders WHERE so_number = 'SO-MG260076' LIMIT 1), '2026-06-05', 'SJP-2604.0076', 'KRY-EXP-01', 'Sandi', 'D 8821 CJM', 4, 'Gudang Warning Bandung', 120, '{"28": 24, "30": 36, "32": 36, "34": 24}'::json, 33000.0, 3960000.0, 'INV-2604-0076', TRUE, 'Pengiriman tuntas 120 pcs.')
ON CONFLICT DO NOTHING;
