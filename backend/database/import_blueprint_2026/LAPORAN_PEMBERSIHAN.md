# Laporan Impor Excel -> Skema Blueprint

Sumber A: `DATA BAHAN NEW 2026.xlsx`  
Sumber B: `Monitoring EX PRODUKSI 2026.xlsx`  
Dibuat: 2026-09-01T18:54:48

### inventory_items — 126 item
- deskripsi kosong -> placeholder: 2
- stok negatif (noise) -> 0: 4
- item harga 0 (bahan CMT milik customer): 99
### material_receipts — 266 baris  (dilewati: kode 6, qty<=0 0)
### material_allocations — 353 baris  (dilewati: kode 49, qty<=0 2, tanpa SO 7)
### Code So — 332 SO (prefill sales_orders)
### sales_orders (Monitoring) — 251 SO
### wip_movements — 563 baris  (snapshot: tanggal dispatch=terima diambil dari 'Tgl Update'; qty dispatch≈terima utk tahap non-sewing; penanda surat_jalan_no 'IMP-2026-%')
### cutting_records — 174 SO  (dilewati tanpa SO: 85; 1 record per SO, hanya bila SO belum punya cutting_record)
### reject_logs — 6 baris  (dilewati: tanpa SO 2, qty<=0 0; stage EMBROIDERY_DEFECT)
### partners (DATA) — 33 kandidat (hanya di-INSERT bila nama belum ada)

## Catatan penting sebelum menjalankan

1. **Prasyarat**: tabel skema blueprint sudah ada (backend blueprint sudah jalan/di-deploy). SQL ini tidak membuat tabel, hanya isi data.
2. **Idempotent**: `partners`/`inventory_items`/`sales_orders` pakai UPSERT; `material_receipts`/`material_allocations`/`wip_movements` dihapus dulu berdasarkan penanda `IMP-2026-%` lalu diisi ulang; `reject_logs` hapus stage `EMBROIDERY_DEFECT` tanpa wip; `cutting_records` hanya di-INSERT bila SO belum punya record. Data manual kamu (penanda lain) tidak tersentuh.
3. **FK buyer**: `sales_orders.buyer_id` di-isi via sub-query nama partner. Jalankan blok `partners` dulu (sudah diurutkan) supaya semua brand ketemu.
4. **`wip_movements` = snapshot, bukan log gerakan asli.** Sheet Monitoring hanya menyimpan angka status per tahap, jadi: tanggal dispatch = tanggal terima = 'Tgl Update'; untuk tahap non-sewing qty dispatch = qty terima; reject tahap sewing diambil dari kolom 'Total Rijek'. Angka mentah diterjemahkan apa adanya (termasuk selisih janggal di sumber).
5. **`cutting_records`**: 1 baris per SO dari sheet GUDANG BAHAN. Bila kolom konsumsi kosong di sumber, `main_fabric_used`/rate = 0.
6. Sheet yang TIDAK diimpor: REKAPAN, Gudang Dewi (semua `#REF!`), Pengajaun Akse, FORM WI, finishing, dan sheet surat-jalan lainnya.