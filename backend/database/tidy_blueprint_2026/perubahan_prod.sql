-- ======================================================================
-- PERUBAHAN UNTUK PROD  -  REVIEW MANUAL. JANGAN dijalankan otomatis.
-- Dibuat: 2026-09-02T15:29:01 oleh tidy_excel_blueprint.py
-- Aturan: "Excel menang" - tiap UPDATE mengembalikan nilai prod ke angka
-- Excel yang sudah dibersihkan. Kunci natural (item_code / so_number).
-- Idempoten: aman dijalankan ulang. TIDAK ada DELETE.
-- ======================================================================

BEGIN;

-- A. inventory_items - stok / harga / deskripsi  (0 baris)
--   (tidak ada perubahan)

-- B. cutting_records - qty_cut / konsumsi kain  (11 baris)
UPDATE cutting_records SET qty_cut=1060, main_fabric_used=1824.0, puring_used=225.5, main_consumption_rate=1.7208, puring_consumption_rate=0.2127 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260004');  -- prod: qty_cut=500 main_fabric_used=650
UPDATE cutting_records SET qty_cut=1060, main_fabric_used=1862.5, puring_used=225.5, main_consumption_rate=1.7571, puring_consumption_rate=0.2127 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260005');  -- prod: qty_cut=1494 main_fabric_used=1942.2
UPDATE cutting_records SET main_fabric_used=278.0, puring_used=23.0, main_consumption_rate=1.39, puring_consumption_rate=0.115 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260028');  -- prod: qty_cut=200 main_fabric_used=260
UPDATE cutting_records SET main_fabric_used=312.0, puring_used=23.0, main_consumption_rate=1.56, puring_consumption_rate=0.115 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260029');  -- prod: qty_cut=200 main_fabric_used=260
UPDATE cutting_records SET main_fabric_used=306.5, main_consumption_rate=1.6217 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260048');  -- prod: qty_cut=189 main_fabric_used=245.7
UPDATE cutting_records SET main_fabric_used=306.5, main_consumption_rate=1.6217 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260049');  -- prod: qty_cut=189 main_fabric_used=245.7
UPDATE cutting_records SET main_fabric_used=266.0, main_consumption_rate=1.6024 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260062');  -- prod: qty_cut=166 main_fabric_used=215.8
UPDATE cutting_records SET main_fabric_used=267.0, main_consumption_rate=1.5988 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260063');  -- prod: qty_cut=167 main_fabric_used=217.1
UPDATE cutting_records SET main_fabric_used=263.0, main_consumption_rate=1.6037 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260064');  -- prod: qty_cut=164 main_fabric_used=213.2
UPDATE cutting_records SET main_fabric_used=150.0, main_consumption_rate=1.25 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260076');  -- prod: qty_cut=120 main_fabric_used=156
UPDATE cutting_records SET main_fabric_used=100.0, main_consumption_rate=1.2821 WHERE so_id=(SELECT id FROM sales_orders WHERE so_number='SO-MG260078');  -- prod: qty_cut=78 main_fabric_used=101.4

-- C. sales_orders - field aman: style_name / item_category / color / brand  (0 baris)
--   (tidak ada perubahan)

-- D. sales_orders - KONSEKUENSIAL: buyer / status / order_qty dari sheet.
--    UPDATE di bawah bisa mengganti buyer atau MENIMPA progres yang mungkin
--    sah dari pemakaian aplikasi. buyer_id pakai COALESCE (tak pernah jadi
--    NULL). Tinjau baris per baris sebelum jalan.  (6 baris)
UPDATE sales_orders SET buyer_id=COALESCE((SELECT id FROM partners WHERE name='VOXFLY ( SMBU )' ORDER BY created_at LIMIT 1), buyer_id) WHERE so_number='SO-MG260004';  -- prod buyer: WILMER STUDIOS
UPDATE sales_orders SET buyer_id=COALESCE((SELECT id FROM partners WHERE name='VOXFLY ( SMBU )' ORDER BY created_at LIMIT 1), buyer_id) WHERE so_number='SO-MG260230';  -- prod buyer: SMBU
UPDATE sales_orders SET buyer_id=COALESCE((SELECT id FROM partners WHERE name='VOXFLY ( SMBU )' ORDER BY created_at LIMIT 1), buyer_id) WHERE so_number='SO-MG260231';  -- prod buyer: SMBU
UPDATE sales_orders SET buyer_id=COALESCE((SELECT id FROM partners WHERE name='VOXFLY ( SMBU )' ORDER BY created_at LIMIT 1), buyer_id) WHERE so_number='SO-MG260232';  -- prod buyer: SMBU
UPDATE sales_orders SET buyer_id=COALESCE((SELECT id FROM partners WHERE name='VOXFLY ( SMBU )' ORDER BY created_at LIMIT 1), buyer_id) WHERE so_number='SO-MG260233';  -- prod buyer: SMBU
UPDATE sales_orders SET buyer_id=COALESCE((SELECT id FROM partners WHERE name='VOXFLY ( SMBU )' ORDER BY created_at LIMIT 1), buyer_id) WHERE so_number='SO-MG260234';  -- prod buyer: SMBU

-- E. Baris BARU (ada di Excel bersih, belum di prod)  (0 baris)
--   (tidak ada)

-- material_receipts: 266 baris IMP-2026 di prod sudah = Excel bersih (tidak ada perubahan).
-- material_allocations: 353 baris (323 kunci) di prod sudah = Excel bersih (tidak ada perubahan).
-- wip_movements: 563 baris IMP-2026 di prod sudah = Excel bersih (79 di antaranya DISCREPANCY_FLAG, setia pada sumber).
-- cutting_records: 18 baris di prod memakai rate persis 1.3 / 0.2 (pola data estimasi/seed - lih. seed_pipeline_data). Untuk baris itu angka Excel kemungkinan yang benar; puring_used=0 di Excel tetap ditandai PERLU KEPUTUSAN (bisa berarti 'tanpa puring' atau 'belum dicatat').

COMMIT;
