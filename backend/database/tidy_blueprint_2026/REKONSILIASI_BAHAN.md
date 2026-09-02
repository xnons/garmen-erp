# Rekonsiliasi DATA BAHAN NEW 2026 vs Web (prod)

Dibuat: 2026-09-02T15:29:01  
Aturan: **Excel menang** - nilai di workbook rapi = hasil parsing Excel yang sudah dibersihkan. Selisih vs prod tercatat di `perubahan_prod.sql` (review manual, tidak dijalankan otomatis). Sel uang kosong di Excel **tidak** dianggap 0 - kalau prod terisi, angka prod dipertahankan & ditandai `PERLU KEPUTUSAN`.

## Ringkasan per entitas

| entitas | baris Excel | OK | BEDA | BARU | perlu keputusan | hanya di web |
|---|--:|--:|--:|--:|--:|--:|
| inventory_items | 126 | 126 | 0 | 0 | 7 | 0 |
| material_receipts | 266 | 266 | 0 | 0 |  | 7 |
| material_allocations | 353 | 353 | 0 | 0 |  | 3 |
| sales_orders (Code So) | 332 | 332 | 0 | 0 |  |  |

## Baris PERLU KEPUTUSAN / BEDA (butuh mata manusia)

### inventory_items  (7)
- `MG-2604-BH0005` - PERLU KEPUTUSAN: harga kosong di Excel, prod=28000.0 (dipertahankan)
- `MG-2604-BH0006` - PERLU KEPUTUSAN: harga kosong di Excel, prod=28000.0 (dipertahankan)
- `MG-2604-BH0007` - PERLU KEPUTUSAN: harga kosong di Excel, prod=32000.0 (dipertahankan)
- `MG-2604-BH0008` - PERLU KEPUTUSAN: harga kosong di Excel, prod=36000.0 (dipertahankan)
- `MG-2604-BH0016` - PERLU KEPUTUSAN: harga kosong di Excel, prod=25000.0 (dipertahankan)
- `MG-2604-BH0017` - PERLU KEPUTUSAN: harga kosong di Excel, prod=35000.0 (dipertahankan)
- `MG-2604-BH0019` - PERLU KEPUTUSAN: harga kosong di Excel, prod=33000.0 (dipertahankan)

### sales_orders (Code So)  (9)
- `SO-MG260004` - selisih diselesaikan oleh sheet Monitoring: BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=WILMER STUDIOS
- `SO-MG260078` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='SKIVE LN#5 REG-FIT' prod='SKIVE LN#5 REG FIT'
- `SO-MG260115` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='SOIL CRG PJ#1' prod='SOIL CRG PJ#1 ARMY'
- `SO-MG260116` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='SOIL CRG PJ#2' prod='SOIL CRG PJ#2 BLACK'
- `SO-MG260117` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='SOIL CRG PJ#3' prod='SOIL CRG PJ#3 KHAKY'
- `SO-MG260118` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='SOIL CRG PJ#4' prod='SOIL CRG PJ#4 BEIGE'
- `SO-MG260119` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='SOIL CRG PJ#5' prod='SOIL CRG PJ#5 ABU'
- `SO-MG260182` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='DECOTON 1.648' prod='DECOTON 1.654'
- `SO-MG260265` - selisih diselesaikan oleh sheet Monitoring: BEDA style_name: excel='CELANA  PENDEK HIJAU' prod='CELANA  PANJANG HIJAU'

## HANYA DI WEB (ada di prod, tak ada di Excel - TIDAK dihapus)

### material_receipts
- `ROLL-TEST-01`
- `ROLL-TEST-01`
- `ROLL-TEST-01`
- `ROLL-TEST-01`
- `ROLL-2604-003`
- `ROLL-2604-001`
- `ROLL-2604-002`
### material_allocations
- `CJM-2608.100`
- `SJ-MAT-2604.02`
- `SJ-MAT-2604.01`

## Catatan

- material_receipts: 266 baris IMP-2026 di prod sudah = Excel bersih (tidak ada perubahan).
- material_allocations: 353 baris (323 kunci) di prod sudah = Excel bersih (tidak ada perubahan).