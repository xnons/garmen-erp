# Laporan Pembersihan Impor Bahan 2026

Sumber: `Salinan dari DATA BAHAN NEW 2026.xlsx`  
Dibuat: 2026-09-01T18:27:38

- 🔧 Stok negatif -0.26 di MG-2604-BH0009 -> 0 (noise pembulatan)
- 🔧 Stok negatif -0.33 di MG-2604-BH0022 -> 0 (noise pembulatan)
- 🔧 Stok negatif -0.5 di MG-2604-BH0042 -> 0 (noise pembulatan)
- 🔧 Stok negatif -0.01 di MG-2604-BH0059 -> 0 (noise pembulatan)

### bahan_baku — 126 item
- Baris kosong/spacer dilewati: 911
- Deskripsi kosong diisi placeholder: 2
- STATUS di-trim/normalisasi: 0
- Brand kosong -> '-': 2
- Stok negatif dinolkan: 4
- Item tanpa harga (harga=0): 99 (wajar utk bahan CMT milik customer)

### log_mutasi_bahan — 626 baris
- MASUK: dilewati (kode kosong 6, qty<=0 0, kode asing 0)
- KELUAR: dilewati (kode kosong 49, qty<=0 2, kode asing 0)
- Kolom stok_sebelum/stok_sesudah dihitung ulang sebagai saldo berjalan per kode (urut tanggal, MASUK sebelum KELUAR di tanggal sama).
- ℹ️  Saldo berjalan sempat minus di 5 kode (keluar tercatat > masuk di Excel): MG-2604-BH0025, MG-2604-BH0027, MG-2604-BH0029, MG-2604-BH0037, MG-2604-BH0073

### katalog_so — 332 SO
- Duplikat NO SO dilewati: 0

### Rekonsiliasi stok master vs saldo mutasi
Semua cocok (selisih <= 1 unit).