# Impor Data Bahan 2026

Hasil pembersihan file `Salinan dari DATA BAHAN NEW 2026.xlsx` → siap masuk database.

## Isi folder

| File | Untuk apa |
|---|---|
| `import_all.sql` | **Jalankan ini** di Supabase → SQL Editor. Berisi semua data + bikin tabel `katalog_so`. |
| `01_bahan_baku.csv` | 126 master bahan (buat dicek manual di Excel). Kolom `_keterangan_excel` = catatan asli, tidak ikut diimpor. |
| `02_log_mutasi_bahan.csv` | 626 riwayat mutasi (271 masuk + 355 keluar), saldo dihitung ulang. |
| `03_katalog_so.csv` | 332 kode SO (brand + style). |
| `LAPORAN_PEMBERSIHAN.md` | Rincian semua data yang diperbaiki / dilewati / ditandai. |

## Cara pakai

1. Pastikan tabel `bahan_baku` & `log_mutasi_bahan` sudah ada di database
   (sudah otomatis kalau backend pernah jalan / sudah deploy).
2. Buka **Supabase → SQL Editor → New query**.
3. Copy-paste seluruh isi `import_all.sql`, klik **Run**.
4. Selesai. Aman dijalankan berulang (idempotent):
   - `bahan_baku` & `katalog_so` → UPSERT (update kalau kode sudah ada).
   - `log_mutasi_bahan` → baris lama bertanda `petugas = 'Import Excel 2026'`
     dihapus dulu, lalu diisi ulang. Data mutasi manual kamu tidak terganggu.

## Regenerasi (kalau Excel diperbarui)

```
cd backend
venv/Scripts/python scripts/import_excel_bahan.py "C:/path/DATA BAHAN NEW 2026.xlsx"
```

## Keputusan mapping penting

- `bahan_baku.stok_saat_ini` diambil dari kolom **STOK AKHIR** sheet "Stok Bahan"
  (sheet master dianggap sumber kebenaran). Mutasi hanya histori — sudah
  direkonsiliasi, semua cocok (selisih ≤ 1 unit).
- `kategori` diisi dari kolom **STATUS** (FOB / CMT / CASH); kosong → `LAINNYA`.
- Bahan CMT umumnya `harga_per_satuan = 0` karena kain milik customer (bukan error).
- Stok minus kecil (mis. -0.26) = noise pembulatan Google Sheets → dinolkan.
- Sel `#ERROR!` (rumus Google Sheets rusak) tidak diimpor; angka dihitung ulang.
