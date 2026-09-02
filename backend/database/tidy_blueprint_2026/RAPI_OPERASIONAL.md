# Rapihkan sheet operasional - Salinan dari Monitoring EX PRODUKSI 2026.xlsx

Dibuat: 2026-09-02T15:29:02  

Sheet ini **tidak** punya padanan di skema web (mengarah ke modul legacy `spk_produksi` yang dorman), jadi hanya dirapihkan - tidak direkonsiliasi dengan prod. Sheet yang punya padanan web (`Monitoring`, `GUDANG BAHAN`, `FORM RIJEK BORDIR`, `DATA`) ditangani `tidy_excel_blueprint.py`.

## Aksi per sheet

- **GUDANG BAHAN**: punya padanan web -> lihat workbook RAPI utama.
- **Gudang Dewi**: header baris 5; 131 baris bersih (buang 929 kosong, 0 TOTAL, 0 ulang-header, 24 fragmen kop-surat, 29 kolom kosong/#REF! (['None', 'XS', 'S', 'M', 'L', 'XL'])).
- **FORM WI**: header baris 6; 163 baris bersih (buang 79 kosong, 19 TOTAL, 5 ulang-header, 18 fragmen kop-surat, 3 kolom kosong/#REF! (['Promosi', 'Jumlah Nilai Proyek', 'KETERANGAN'])).
- **Sheet28**: sheet kosong -> aman dihapus.
- **Pengajaun Akse**: header baris 12; 803 baris bersih (buang 10243 kosong, 0 TOTAL, 48 ulang-header, 0 fragmen kop-surat, 1 kolom kosong/#REF! (['None'])).
- **FORM RIJEK BORDIR**: punya padanan web -> lihat workbook RAPI utama.
- **DATA**: punya padanan web -> lihat workbook RAPI utama.
- **finishing**: header baris 4; 12 baris bersih (buang 17 kosong, 2 TOTAL, 0 ulang-header, 0 fragmen kop-surat, 3 kolom kosong/#REF! (['None', 'None', 'None'])).
- **Monitoring**: punya padanan web -> lihat workbook RAPI utama.
- **Output Cutt Pers**: header baris 5; 414 baris bersih (buang 2528 kosong, 0 TOTAL, 0 ulang-header, 42 fragmen kop-surat, 8 kolom kosong/#REF! (['.', '.', 'None', 'None', 'None', '.'])).
- **Form Produksi Anis**: header baris 5; 242 baris bersih (buang 1902 kosong, 0 TOTAL, 0 ulang-header, 0 fragmen kop-surat).
- **To Produksi Pa Ato**: header baris 5; 651 baris bersih (buang 402 kosong, 0 TOTAL, 0 ulang-header, 245 fragmen kop-surat, 5 kolom kosong/#REF! (['.', '.', 'Permarks', 'None', 'None'])).
- **Rekapan Pengiriman Sandi**: header baris 5; 1205 baris bersih (buang 1629 kosong, 0 TOTAL, 0 ulang-header, 503 fragmen kop-surat, 3 kolom kosong/#REF! (['.', '.', 'None'])).
- **To Washing Anis**: header baris 5; 187 baris bersih (buang 10459 kosong, 0 TOTAL, 0 ulang-header, 468 fragmen kop-surat, 5 kolom kosong/#REF! (['None', '.', '.', 'None', 'None'])).
- **To Print Mentah Puring Pa Ato **: header baris 5; 124 baris bersih (buang 179 kosong, 0 TOTAL, 0 ulang-header, 189 fragmen kop-surat, 6 kolom kosong/#REF! (['Description', '.', '.', 'Remarks', 'None', 'None'])).
- **To Embrodeiry  Mentah Pa Ato **: header baris 5; 89 baris bersih (buang 3 kosong, 0 TOTAL, 0 ulang-header, 87 fragmen kop-surat, 9 kolom kosong/#REF! (['.', 'XS', '6XL', '.', 'Harga', 'Total'])).
- **To Embrodeiry Jadi  Anis**: header baris 5; 99 baris bersih (buang 58 kosong, 0 TOTAL, 0 ulang-header, 12 fragmen kop-surat, 9 kolom kosong/#REF! (['.', '5XL', '6XL', '.', 'Harga', 'Total'])).
- **Surat Jalan Sample**: header baris 1; 226 baris bersih (buang 386 kosong, 16 TOTAL, 0 ulang-header, 0 fragmen kop-surat, 2 kolom kosong/#REF! (['None', 'None'])).
- **Finishing **: header baris 5; 177 baris bersih (buang 905 kosong, 0 TOTAL, 0 ulang-header, 2 fragmen kop-surat, 6 kolom kosong/#REF! (['Supplier', '.', '6XL', '.', 'Setor', 'Remarks'])).
- **Finishing Borongan _**: header baris 5; 1331 baris bersih (buang 843 kosong, 0 TOTAL, 0 ulang-header, 0 fragmen kop-surat, 4 kolom kosong/#REF! (['None', 'None', 'None', '.'])).

## Hasil

- Workbook: `Monitoring EX PRODUKSI 2026 - RAPI (operasional).xlsx` (15 sheet bersih + _INFO)
- Sheet form (kop surat + blok berulang: `Pengajaun Akse`, `Surat Jalan Sample`, `FORM WI`) tetap ber-bentuk form; baris item diekstrak apa adanya di bawah header yang terdeteksi - perlu rapi manual bila mau jadi tabel relasional.
- `Gudang Dewi`: kolom ukuran (XS-6XL) & aksesoris hilang permanen (semua `=#REF!` di file sumber, turunan dari sheet lain yang barisnya sudah bergeser). Kolom yang selamat (No, Tanggal, So Order, Brand, Artikel, Style, Maklon, blok kanan Name Bahan/Yard/Harga/Nominal) dipertahankan.
- File 1 (`DATA BAHAN NEW 2026.xlsx`) juga punya 3 sheet non-web (`REKAPAN` rekap, `FABRIC INSPECTION` form, `Sheet25` surat jalan) - kecil, belum dirapihkan di ronde ini.