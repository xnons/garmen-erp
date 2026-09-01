# ⚠️ Folder ini DITINGGALKAN (superseded)

`import_all.sql` di sini menyasar tabel **skema lama** (`bahan_baku`,
`log_mutasi_bahan`, `katalog_so`) — semuanya kosong di DB live dan modulnya
sudah dorman.

**Pakai `../import_blueprint_2026/import_blueprint.sql`** yang menyasar skema
blueprint aktif (`inventory_items`, `material_receipts`, `material_allocations`,
`sales_orders`, `wip_movements`, `cutting_records`, `reject_logs`, `partners`).

Alasan lengkap: `docs/ANALISIS-MODUL-PRODUKSI.md`.

Berkas di folder ini disimpan hanya untuk referensi pembersihan sheet
"Stok Bahan" (mapping & aturan bersih-bersih sama, target tabelnya saja beda).
