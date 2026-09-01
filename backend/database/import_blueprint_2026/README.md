# Impor Excel → Skema Blueprint (2026)

Hasil pembersihan **2 file Excel** → siap masuk database blueprint yang aktif dipakai app.

| Sumber | Sheet | → Tabel |
|---|---|---|
| DATA BAHAN NEW 2026.xlsx | Stok Bahan | `inventory_items` (126) |
| | Barang Masuk | `material_receipts` (266) |
| | Barang Keluar | `material_allocations` (353) |
| | Code So | `sales_orders` prefill (332) |
| Monitoring EX PRODUKSI 2026.xlsx | Monitoring | `sales_orders` (251) + `wip_movements` (563) |
| | GUDANG BAHAN | `cutting_records` (174) |
| | FORM RIJEK BORDIR | `reject_logs` (6) |
| | DATA | `partners` (33 kandidat, insert bila belum ada) |

## Isi folder

| File | Fungsi |
|---|---|
| `import_blueprint.sql` | **Jalankan ini** di Supabase → SQL Editor. Satu transaksi, idempotent. |
| `0X_*.csv` | Data bersih per tabel — untuk review manual di Excel. Kolom berawalan `_` = info bantu, tidak ikut ke SQL. |
| `LAPORAN_PEMBERSIHAN.md` | Ringkasan perbaikan + **catatan penting** (baca dulu). |

## Cara pakai

1. Buka **Supabase → SQL Editor → New query**.
2. Paste seluruh `import_blueprint.sql` → **Run**.
3. Aman diulang. Data manual kamu tidak tersentuh (lihat butir idempotent di LAPORAN).

## Regenerasi (kalau Excel diperbarui)

```
cd backend
venv/Scripts/python scripts/import_excel_blueprint.py \
  "C:/Users/borde/Downloads/skrip/DATA BAHAN NEW 2026.xlsx" \
  "C:/Users/borde/Downloads/skrip/Monitoring EX PRODUKSI 2026.xlsx"
```

## Kenapa bukan `bahan_baku` / `spk_produksi`?

DB live memakai **skema blueprint** (`partners`/`sales_orders`/`wip_movements`/
`inventory_items`/…). Tabel skema lama (`bahan_baku`, `spk_produksi`,
`log_mutasi_bahan`) semuanya **kosong** dan modul yang membacanya sudah dorman.
Lihat `docs/ANALISIS-MODUL-PRODUKSI.md`. Folder `../import_bahan_2026/` (target
`bahan_baku`) **ditinggalkan** — pakai folder ini.
