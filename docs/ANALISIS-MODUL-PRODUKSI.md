# Analisis: Modul "Produksi Borongan" (lama) vs Blueprint 6-Fase (baru)

> Dokumen keputusan. Tujuannya membantu memutuskan nasib modul lama
> (`components/produksi/` + tabel `spk_produksi`). **Belum ada perubahan kode
> untuk penggabungan** — dua sistem masih jalan paralel di menu.

---

## 1. Ringkasan

Aplikasi ini menjalankan **dua sistem pelacakan produksi yang berdiri sendiri**:

| | **Modul lama — "Produksi Borongan"** | **Blueprint baru — 6 Fase** |
|---|---|---|
| Basis data | `spk_produksi`, `master_tarif_borongan`, `log_output_borongan` | `sales_orders`, `wip_movements`, `piece_rate_wages`, `cutting_records`, dll. |
| Router | `produksi_master.py`, `produksi_output.py` (prefix `/api/produksi`) | `ppic_so.py`, `warehouse_fabric.py`, `cutting_prep.py`, `wip_subcon.py`, `finishing_shipping.py` |
| Frontend | `components/produksi/` (10 file, ±3.900 baris) | `components/{ppic,warehouse,cutting,wip,finishing,shipping,analytics}/` |
| Menu sidebar | `produksi` ("Produksi Borongan") | `ppic-so`, `warehouse-fabric`, `cutting-prep`, `wip-subcon`, `finishing-wages`, `shipping-billing`, `wip-control-tower`, `executive-analytics`, `reports` |
| Fokus | **Upah borongan per operator, per tahapan** — internal / CMT | **Kontrak buyer → kirim** — vendor subkon, material, penagihan |
| Unit kerja | SPK (Surat Perintah Kerja) internal | Sales Order (kontrak buyer / PO) |

Keduanya **berbagi**: tabel `karyawan`, tabel `mesin` & `bahan_baku`, dan
tabel `log_payroll_produksi` (riwayat pencairan gaji).

---

## 2. Yang HANYA ada di modul lama

Fitur berikut **tidak punya padanan** di blueprint baru:

1. **Master tarif borongan per tahapan** (`master_tarif_borongan`) + **snapshot tarif**
   saat setoran dibuat. Blueprint baru hanya punya `wage_per_piece` bebas per
   entri `PieceRateWage` (finishing) dan `piece_rate` per `CuttingPrepTask` —
   tanpa master tarif per SPK/tahapan.
2. **Setoran output harian per operator per tahapan** (`log_output_borongan`)
   dengan `qty_pass / qty_rework / qty_scrap`, foto bukti setoran & defect.
   Blueprint baru mencatat di level **batch vendor** (`WIPMovement`), bukan per
   penjahit.
3. **Verifikasi QC ber-jenjang**: anti-self-verify (operator/petugas input tak
   boleh verifikasi hasilnya sendiri), audit revisi wajib beralasan
   (`log_audit_verifikasi_qc`), verifikasi massal.
4. **Hard-cap rantai proses**: output tahapan lanjutan tidak boleh melebihi hasil
   CUTTING yang sudah di-approve QC. Blueprint baru tidak memvalidasi ini.
5. **Integrasi mesin + bahan baku per setoran**: setiap entri output bisa
   mengurangi stok `bahan_baku` otomatis + catat `log_mutasi_bahan`, dan
   menandai operator aktif pada `mesin`.
6. **Penghapusan ber-PIN + rollback**: soft-delete setoran butuh PIN, otomatis
   rollback kuota potong + stok bahan.
7. **Alur payroll borongan lengkap**: `GET /api/produksi/payroll/rekap-unpaid`
   → `POST /api/produksi/payroll/mark-paid` → `LogPayrollProduksi` per pekerja
   (baru disamakan di commit b079610). Modul `payroll.py` (periode YYYY-MM) juga
   membaca `log_output_borongan`.
8. **Analitik borongan**: tren harian pcs/upah, progress per SPK, defect rate per
   tahapan (`/api/produksi/analytics`).

> Intinya: modul lama adalah **sistem penggajian borongan + QC granular per
> penjahit**. Itu inti nilainya.

---

## 3. Yang HANYA ada di blueprint baru

1. **Kontrak buyer**: `Partner` (buyer/supplier/subkon), `SalesOrder` dengan
   nomor PO, termin pembayaran, PPN, diskon, nilai kontrak.
2. **Gudang kain**: penerimaan roll (`MaterialReceipt`), **QC 4-Point ASTM**
   (`FabricInspection` — rumus summary point + grade A/B/C; baru dihidupkan lagi
   di commit ee4baf2), alokasi kain ke potong dengan surat jalan
   (`MaterialAllocation`).
3. **Pipeline subkon sekuensial**: `WIPMovement` per tahapan (Print → Bordir →
   Jahit Maklun → Washing → Bordir Jadi → Finishing) dengan dispatch/receive,
   **rekonsiliasi selisih** `Kirim − (Terima + Rijek) = Selisih` dan status
   `DISCREPANCY_FLAG` (baru diperbaiki di commit c076cd7).
4. **Kerugian rijek bernilai rupiah** (`RejectLog`).
5. **Pengiriman & penagihan**: `Shipment` (SJP) + nomor invoice / Form WI.
6. **Master Control Tower** (matriks WIP live), **Executive Analytics** (P&L,
   throughput stasiun, porsi buyer), **modul Laporan** (produksi / keuangan /
   vendor scorecard, export Excel — commit 8d7976a/1492c43).
7. **Notifikasi & alert** (deadline, stok, selisih vendor — commit 56d9571).

> Blueprint baru adalah **rantai kontrak-buyer → material → subkon → kirim →
> tagih**. Ia lemah di penggajian penjahit internal.

---

## 4. Overlap & konflik

| Area | Modul lama | Blueprint baru | Catatan |
|---|---|---|---|
| Progress produksi | per tahapan `log_output_borongan` | per batch `WIPMovement` + `PieceRateWage` | **Tumpang tindih** — bisa dobel input kalau dua-duanya dipakai untuk order yang sama |
| Upah satuan | `log_output_borongan.subtotal_rp` (tarif × qty_pass) | `PieceRateWage.total_wage`, `CuttingPrepTask.total_wage` | Dua sumber angka upah |
| Payroll | `log_payroll_produksi` via `/api/produksi/payroll` & `/api/payroll` | tidak ada jalur payroll sendiri | Blueprint baru **belum** menyalurkan `PieceRateWage` ke slip gaji |
| Cutting | `log_output_borongan` tahapan CUTTING (qty + hard-cap) | `CuttingRecord` (yield kain, marker, afval) | Sudut pandang beda: upah vs efisiensi kain |
| Prefix API | `/api/produksi/*` (master + output) | `/api/ppic`, `/api/wip`, dll. | Tidak bentrok |
| Menu | 1 menu `produksi` | 8+ menu | — |

Risiko utama bila **dua-duanya dipakai untuk order yang sama**: angka produksi
& upah tercatat ganda, laporan jadi tidak konsisten.

---

## 5. Tiga opsi

### Opsi A — Pertahankan keduanya, pisahkan domain (rekomendasi jangka pendek)
- **Modul lama** = order **borongan internal / CMT jasa jahit** (fokus upah penjahit per tahapan + QC granular).
- **Blueprint baru** = order **buyer/ekspor** (kontrak → material → subkon → kirim → tagih).
- Aksi: beri label jelas di sidebar ("Produksi Borongan Internal" vs "Alur Order Buyer"), tulis SOP singkat kapan pakai yang mana, tambahkan peringatan agar 1 order tidak diinput di dua sistem.
- **Effort: ~0,5 hari.** Risiko rendah. Tidak menghapus apa pun.

### Opsi B — Serap penggajian borongan ke blueprint baru
- Tambahkan ke blueprint: tabel master tarif per SO/tahapan, entri output per operator, QC anti-self-verify + hard-cap, lalu salurkan `PieceRateWage` + output baru ke `LogPayrollProduksi`.
- Migrasi data `spk_produksi`/`log_output_borongan` historis → tetap read-only di modul lama (arsip), data baru masuk blueprint.
- Pensiunkan menu `produksi` setelah fitur setara siap.
- **Effort: ~2–3 minggu.** Risiko sedang (menyentuh payroll). **Butuh test dulu untuk area payroll** — sudah ada sebagian di `test_produksi_flow.py`.

### Opsi C — Migrasi penuh lalu hapus modul lama
- Semua fitur unik modul lama (bagian 2) direplika di blueprint, seluruh data historis dimigrasi ke `sales_orders`/`wip_movements`, `components/produksi/` + `produksi_master.py`/`produksi_output.py` + tabel `spk_*` dihapus.
- **Effort: ~4–6 minggu.** Risiko tinggi: `SPKProduksi` tidak selalu punya buyer; granularitas per-penjahit tak punya rumah alami di `WIPMovement`; butuh migrasi data + test regresi menyeluruh; downtime/parallel-run.

---

## 6. Rekomendasi

1. **Sekarang: Opsi A.** Beri batas domain yang jelas, label menu, dan SOP.
   Nol risiko, langsung menghentikan kebingungan "pakai yang mana".
2. **Bertahap: geser ke Opsi B** kalau memang mau satu sistem — kerjakan setelah
   cakupan test payroll/QC diperlebar (lanjutan Fase 3A). Jangan Opsi C kecuali
   ada kebutuhan bisnis kuat; rasio risiko/manfaatnya buruk.
3. **Jangan hapus `components/produksi/` atau tabel `spk_*` sebelum** fitur
   pengganti (master tarif + QC berjenjang + hard-cap + payroll borongan) benar-
   benar ada dan teruji di blueprint.

## 7. Berkas terkait

- Modul lama: `backend/routers/produksi_master.py`, `backend/routers/produksi_output.py`,
  `backend/models.py` (kelas `SPKProduksi`, `MasterTarifBorongan`, `LogOutputBorongan`,
  `LogAuditVerifikasiQC`), `frontend/components/produksi/*`
- Payroll (dipakai kedua sisi): `backend/routers/payroll.py`, `backend/models.py::LogPayrollProduksi`
- Blueprint baru: `backend/routers/{ppic_so,warehouse_fabric,cutting_prep,wip_subcon,finishing_shipping}.py`,
  `backend/schemas/garment_blueprint.py`, `frontend/components/{ppic,warehouse,cutting,wip,finishing,shipping}/*`
