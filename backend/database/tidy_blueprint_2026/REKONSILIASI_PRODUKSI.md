# Rekonsiliasi Monitoring EX PRODUKSI 2026 vs Web (prod)

Dibuat: 2026-09-02T15:29:01  
Aturan: **Excel menang** - nilai di workbook rapi = hasil parsing Excel yang sudah dibersihkan. Selisih vs prod tercatat di `perubahan_prod.sql` (review manual, tidak dijalankan otomatis). Sel uang kosong di Excel **tidak** dianggap 0 - kalau prod terisi, angka prod dipertahankan & ditandai `PERLU KEPUTUSAN`.

## Ringkasan per entitas

| entitas | baris Excel | OK | BEDA | BARU | perlu keputusan | hanya di web |
|---|--:|--:|--:|--:|--:|--:|
| sales_orders (Monitoring) | 251 | 245 | 6 | 0 |  | 0 |
| wip_movements | 563 | 563 | 0 | 0 | 79 | 29 |
| cutting_records | 174 | 162 | 11 | 0 | 1 | 6 |
| reject_logs | 6 | 6 | 0 | 0 |  | 1 |
| partners | 33 | 33 |  | 0 |  | 10 |

## Baris PERLU KEPUTUSAN / BEDA (butuh mata manusia)

### sales_orders (Monitoring)  (6)
- `SO-MG260004` - BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=WILMER STUDIOS
- `SO-MG260230` - BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=SMBU
- `SO-MG260231` - BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=SMBU
- `SO-MG260232` - BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=SMBU
- `SO-MG260233` - BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=SMBU
- `SO-MG260234` - BEDA brand: excel=VOXFLY ( SMBU ) prod_buyer=SMBU

### wip_movements  (79)
- `SO-MG260004` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260005` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260025` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260061` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260078` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260116` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260117` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260118` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260119` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260143` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260144` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260145` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260146` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260147` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260150` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260151` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260158` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260159` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260184` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260185` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260186` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260187` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260191` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260193` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260196` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260210` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260211` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260213` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260215` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260216` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260217` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260218` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260219` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260221` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260222` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260223` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260225` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260226` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260227` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260228` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260229` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260230` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260231` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260232` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260233` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260234` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260235` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260236` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260237` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260238` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260239` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260242` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260244` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260248` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260249` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260250` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260251` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260252` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260253` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260266` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260269` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260280` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260281` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260282` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260283` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260284` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260285` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260307` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260308` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260309` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260310` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260311` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260312` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260313` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260314` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260315` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260316` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260317` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)
- `SO-MG260318` - DISCREPANCY_FLAG - setia pada angka sumber (bukan bug impor)

### cutting_records  (12)
- `SO-MG260004` - BEDA qty_cut: excel=1060.0 prod=500.0 | BEDA main_fabric_used: excel=1824.0 prod=650.0 | BEDA puring_used: excel=225.5 prod=100.0 | BEDA main_consumption_rate: excel=1.7208 prod=1.3 | BEDA puring_consumption_rate: excel=0.2127 prod=0.2
- `SO-MG260005` - BEDA qty_cut: excel=1060.0 prod=1494.0 | BEDA main_fabric_used: excel=1862.5 prod=1942.2 | BEDA puring_used: excel=225.5 prod=298.8 | BEDA main_consumption_rate: excel=1.7571 prod=1.3 | BEDA puring_consumption_rate: excel=0.2127 prod=0.2
- `SO-MG260025` - PERLU KEPUTUSAN: main_fabric_used kosong di Excel, prod=1511.9 (dipertahankan) | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=232.6 (dipertahankan) | PERLU KEPUTUSAN: main_consumption_rate kosong di Excel, prod=1.3 (dipertahankan) | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260028` - BEDA main_fabric_used: excel=278.0 prod=260.0 | BEDA puring_used: excel=23.0 prod=40.0 | BEDA main_consumption_rate: excel=1.39 prod=1.3 | BEDA puring_consumption_rate: excel=0.115 prod=0.2
- `SO-MG260029` - BEDA main_fabric_used: excel=312.0 prod=260.0 | BEDA puring_used: excel=23.0 prod=40.0 | BEDA main_consumption_rate: excel=1.56 prod=1.3 | BEDA puring_consumption_rate: excel=0.115 prod=0.2
- `SO-MG260048` - BEDA main_fabric_used: excel=306.5 prod=245.7 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=37.8 (dipertahankan) | BEDA main_consumption_rate: excel=1.6217 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260049` - BEDA main_fabric_used: excel=306.5 prod=245.7 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=37.8 (dipertahankan) | BEDA main_consumption_rate: excel=1.6217 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260062` - BEDA main_fabric_used: excel=266.0 prod=215.8 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=33.2 (dipertahankan) | BEDA main_consumption_rate: excel=1.6024 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260063` - BEDA main_fabric_used: excel=267.0 prod=217.1 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=33.4 (dipertahankan) | BEDA main_consumption_rate: excel=1.5988 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260064` - BEDA main_fabric_used: excel=263.0 prod=213.2 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=32.8 (dipertahankan) | BEDA main_consumption_rate: excel=1.6037 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260076` - BEDA main_fabric_used: excel=150.0 prod=156.0 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=24.0 (dipertahankan) | BEDA main_consumption_rate: excel=1.25 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)
- `SO-MG260078` - BEDA main_fabric_used: excel=100.0 prod=101.4 | PERLU KEPUTUSAN: puring_used kosong di Excel, prod=15.6 (dipertahankan) | BEDA main_consumption_rate: excel=1.2821 prod=1.3 | PERLU KEPUTUSAN: puring_consumption_rate kosong di Excel, prod=0.2 (dipertahankan)

## HANYA DI WEB (ada di prod, tak ada di Excel - TIDAK dihapus)

### wip_movements
- `SJ-SEW-2608.01`
- `SJ-SEW-0001`
- `SJ-SEW-0048`
- `SJ-SEW-0078`
- `SJ-SEW-0063`
- `SJ-WSH-0003`
- `SJ-WSH-0025`
- `SJ-WSH-2604.01`
- `SJ-WSH-0049`
- `SJ-SEW-0076`
- `SJ-SEW-0064`
- `SJ-WSH-0028`
- `SJ-SEW-2604.01`
- `SJ-WSH-0063`
- `SJ-SEW-0002`
- `SJ-WSH-0062`
- `SJ-WSH-0002`
- `SJ-WSH-0064`
- `SJ-SEW-0029`
- `SJ-SEW-0028`
- `SJ-WSH-0048`
- `SJ-WSH-0029`
- `SJ-SEW-0025`
- `SJ-WSH-0078`
- `SJ-SEW-0049`
- `SJ-SEW-0003`
- `SJ-WSH-0076`
- `SJ-SEW-0062`
- `SJ-WSH-0001`
### cutting_records
- `SO-MG260001`
- `SO-MG260002`
- `SO-MG260003`
- `SO-MG260007`
- `SO-MG260008`
- `SO-MG260009`
### reject_logs
- `SO-MG260004`
### partners
- `AL-ITIHAD`
- `CAMO WARBROKE`
- `FADFAD`
- `GOTO FADFAD`
- `PAKDENNY`
- `PAMOKIDS`
- `SERAGAM`
- `SERPARANG`
- `SGI`
- `SMBU`

## Catatan

- wip_movements: 563 baris IMP-2026 di prod sudah = Excel bersih (79 di antaranya DISCREPANCY_FLAG, setia pada sumber).
- cutting_records: 18 baris di prod memakai rate persis 1.3 / 0.2 (pola data estimasi/seed - lih. seed_pipeline_data). Untuk baris itu angka Excel kemungkinan yang benar; puring_used=0 di Excel tetap ditandai PERLU KEPUTUSAN (bisa berarti 'tanpa puring' atau 'belum dicatat').