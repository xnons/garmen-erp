from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from database import get_db
import models
from schemas.produksi import (
    LogOutputCreate,
    LogOutputVerifikasi,
    LogOutputResponse,
    BulkVerifyRequest,
    MarkPayrollPaidRequest,
    RekapGajiPekerjaResponse,
    PayrollLogItem,
    StatusSPK,
    StatusVerifikasiOutput
)
from core.security import get_current_user
from core.deps import require_roles, get_enum_val

# Router Output & QC Produksi
router = APIRouter(prefix="/api/produksi", tags=["Produksi - Output, QC & Payroll"])


# ===========================================================================
# 1️⃣ INPUT OUTPUT HARIAN WORKER
# ===========================================================================

@router.post("/output", response_model=LogOutputResponse, status_code=status.HTTP_201_CREATED)
@router.post("/output/", response_model=LogOutputResponse, status_code=status.HTTP_201_CREATED)
def record_worker_output(
    payload: LogOutputCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    tahapan_str = get_enum_val(payload.tahapan_proses)

    # 1. Validasi Matematika Setoran (Pass + Rework + Scrap == Disetor)
    rework_val = getattr(payload, 'qty_rework', 0) or 0
    scrap_val = getattr(payload, 'qty_scrap', 0) or 0
    legacy_reject = getattr(payload, 'qty_reject', 0) or 0
    
    total_defect = (rework_val + scrap_val) if (rework_val > 0 or scrap_val > 0) else legacy_reject
    if rework_val == 0 and scrap_val == 0 and legacy_reject > 0:
        rework_val = legacy_reject

    if (payload.qty_pass + total_defect) != payload.qty_disetor:
        raise HTTPException(
            status_code=400,
            detail="Validasi Gagal: Jumlah QTY Pass + Rework + Scrap harus persis sama dengan Total Disetor!"
        )

    # 2. Validasi Role Produksi
    karyawan = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == payload.karyawan_id).first()
    if not karyawan:
        raise HTTPException(status_code=404, detail=f"Karyawan ID '{payload.karyawan_id}' tidak terdaftar.")
    if getattr(karyawan, "role", "").upper() != "PRODUKSI":
        raise HTTPException(
            status_code=400,
            detail=f"Karyawan '{karyawan.nama}' bukan personel dari Divisi Produksi."
        )

    # 3. Validasi Status SPK
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == payload.spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{payload.spk_id}' tidak terdaftar.")

    if spk.status == StatusSPK.DRAFT.value:
        raise HTTPException(status_code=400, detail="SPK masih berstatus DRAFT dan belum resmi dirilis.")
    elif spk.status in [StatusSPK.FINISHED.value, StatusSPK.ARCHIVED.value]:
        raise HTTPException(status_code=400, detail="SPK sudah FINISHED/ARCHIVED, tidak menerima input output baru.")

    # 4. Snapshot Tarif Borongan
    tarif_record = db.query(models.MasterTarifBorongan).filter(
        models.MasterTarifBorongan.spk_id == payload.spk_id,
        models.MasterTarifBorongan.tahapan_proses == tahapan_str
    ).first()

    if not tarif_record or tarif_record.tarif_per_pcs <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"Tarif borongan untuk proses '{tahapan_str}' pada SPK '{payload.spk_id}' belum diatur!"
        )

    # 5. CHAIN HARD-CAP VALIDATION
    if tahapan_str == "CUTTING":
        total_cutting_exist = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
            models.LogOutputBorongan.spk_id == payload.spk_id,
            models.LogOutputBorongan.tahapan_proses == "CUTTING",
            models.LogOutputBorongan.is_deleted == False,
            models.LogOutputBorongan.status_verifikasi != StatusVerifikasiOutput.REJECTED.value
        ).scalar()

        if (total_cutting_exist + payload.qty_pass) > spk.target_qty:
            sisa_kuota = max(0, spk.target_qty - total_cutting_exist)
            raise HTTPException(
                status_code=400,
                detail=f"Batas Potong (Hard-Cap) Terlampaui! Target SPK: {spk.target_qty} Pcs. Sudah terpotong: {total_cutting_exist} Pcs. Sisa kuota potong: {sisa_kuota} Pcs."
            )
    else:
        total_cutting_approved = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
            models.LogOutputBorongan.spk_id == payload.spk_id,
            models.LogOutputBorongan.tahapan_proses == "CUTTING",
            models.LogOutputBorongan.is_deleted == False,
            models.LogOutputBorongan.status_verifikasi == StatusVerifikasiOutput.APPROVED.value
        ).scalar()

        total_subproses_exist = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
            models.LogOutputBorongan.spk_id == payload.spk_id,
            models.LogOutputBorongan.tahapan_proses == tahapan_str,
            models.LogOutputBorongan.is_deleted == False,
            models.LogOutputBorongan.status_verifikasi != StatusVerifikasiOutput.REJECTED.value
        ).scalar()

        if (total_subproses_exist + payload.qty_pass) > total_cutting_approved:
            raise HTTPException(
                status_code=400,
                detail=f"Alur Rantai Pasok Terisolasi! Output {tahapan_str} ({total_subproses_exist + payload.qty_pass} Pcs) melebihi hasil Cutting yang sudah di-approve QC ({total_cutting_approved} Pcs)."
            )

    # 6. Validasi & Penanganan Mesin yang Digunakan
    mesin_record = None
    if getattr(payload, "kode_mesin", None):
        mesin_record = db.query(models.Mesin).filter(models.Mesin.kode_mesin == payload.kode_mesin).first()
        if not mesin_record:
            raise HTTPException(status_code=404, detail=f"Mesin dengan kode '{payload.kode_mesin}' tidak ditemukan!")
        # Update operator aktif pada mesin
        mesin_record.operator_id = payload.karyawan_id
        mesin_record.updated_at = datetime.utcnow()

    # 7. Validasi & Pengurangan Bahan Baku Inventaris
    bahan_record = None
    jumlah_dipakai = 0.0
    if getattr(payload, "bahan_id", None):
        bahan_record = db.query(models.BahanBaku).filter(models.BahanBaku.id == payload.bahan_id).first()
        if not bahan_record:
            raise HTTPException(status_code=404, detail=f"Bahan baku ID '{payload.bahan_id}' tidak ditemukan di inventaris!")

        # Tentukan jumlah pemakaian bahan
        if getattr(payload, "jumlah_bahan_digunakan", 0) and payload.jumlah_bahan_digunakan > 0:
            jumlah_dipakai = float(payload.jumlah_bahan_digunakan)
        elif tahapan_str == "CUTTING" and getattr(spk, "konsumsi_kain_per_pcs", 0) and spk.konsumsi_kain_per_pcs > 0:
            jumlah_dipakai = round(float(payload.qty_pass) * float(spk.konsumsi_kain_per_pcs), 2)

        if jumlah_dipakai > 0:
            stok_awal = float(bahan_record.stok_saat_ini or 0.0)
            stok_akhir = stok_awal - jumlah_dipakai
            bahan_record.stok_saat_ini = stok_akhir
            bahan_record.terakhir_diperbarui = datetime.utcnow()

            # Rekam mutasi bahan KELUAR_PRODUKSI
            log_mutasi = models.LogMutasiBahan(
                bahan_id=bahan_record.id,
                tanggal=datetime.utcnow(),
                tipe="KELUAR_PRODUKSI",
                jumlah=jumlah_dipakai,
                stok_sebelum=stok_awal,
                stok_sesudah=stok_akhir,
                referensi_po_spk=f"{spk.id} - Setoran {tahapan_str} #{getattr(payload, 'nomor_tiket', '') or ''}",
                catatan=f"Pengurangan otomatis output produksi {tahapan_str} ({payload.qty_pass} Pcs) oleh {karyawan.nama}",
                petugas=getattr(current_user, "nama", None) or current_user.id_karyawan
            )
            db.add(log_mutasi)

    # 8. Hitung & Simpan Log Output
    tarif_snapshot = tarif_record.tarif_per_pcs
    subtotal = payload.qty_pass * tarif_snapshot

    new_log = models.LogOutputBorongan(
        tanggal=payload.tanggal,
        karyawan_id=payload.karyawan_id,
        spk_id=payload.spk_id,
        tahapan_proses=tahapan_str,
        nomor_tiket=getattr(payload, 'nomor_tiket', None),
        kode_mesin=payload.kode_mesin if getattr(payload, 'kode_mesin', None) else None,
        bahan_id=payload.bahan_id if getattr(payload, 'bahan_id', None) else None,
        jumlah_bahan_digunakan=jumlah_dipakai,
        qty_disetor=payload.qty_disetor,
        qty_pass=payload.qty_pass,
        qty_rework=rework_val,
        qty_scrap=scrap_val,
        qty_reject=total_defect,
        tarif_per_pcs=tarif_snapshot,
        subtotal_rp=subtotal,
        status_verifikasi=StatusVerifikasiOutput.PENDING.value,
        catatan=payload.catatan,
        petugas_input=getattr(current_user, "nama", None) or current_user.id_karyawan,
        foto_bukti_setoran=payload.foto_bukti_setoran,
        verifier_id=None,
        is_paid=False,
        is_deleted=False
    )

    if tahapan_str == "CUTTING":
        spk.realisasi_potong += payload.qty_pass

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    new_log.nama_karyawan = karyawan.nama
    new_log.tipe_pay_karyawan = getattr(karyawan, "tipe_pay", "BORONGAN")
    new_log.nama_artikel = spk.nama_artikel
    new_log.nama_mesin = f"{mesin_record.nama_mesin} ({mesin_record.kode_mesin})" if mesin_record else None
    new_log.nama_bahan = bahan_record.nama_item if bahan_record else None
    new_log.satuan_bahan = bahan_record.satuan if bahan_record else None
    return new_log


def _populate_log_details(log: models.LogOutputBorongan):
    log.nama_karyawan = log.karyawan.nama if log.karyawan else log.karyawan_id
    log.tipe_pay_karyawan = log.karyawan.tipe_pay if log.karyawan else "BORONGAN"
    log.nama_artikel = log.spk.nama_artikel if log.spk else "-"
    log.nama_mesin = f"{log.mesin.nama_mesin} ({log.mesin.kode_mesin})" if log.mesin else (log.kode_mesin or None)
    log.nama_bahan = log.bahan.nama_item if log.bahan else (log.bahan_id or None)
    log.satuan_bahan = log.bahan.satuan if log.bahan else None


@router.get("/output", response_model=List[LogOutputResponse])
@router.get("/output/", response_model=List[LogOutputResponse])
def get_output_logs(
    tanggal: Optional[date] = Query(None, description="Filter tanggal spesifik"),
    start_date: Optional[date] = Query(None, description="Filter rentang tanggal awal"),
    end_date: Optional[date] = Query(None, description="Filter rentang tanggal akhir"),
    karyawan_id: Optional[str] = Query(None, description="Filter per karyawan"),
    spk_id: Optional[str] = Query(None, description="Filter per SPK"),
    kode_mesin: Optional[str] = Query(None, description="Filter per mesin"),
    status_verifikasi: Optional[StatusVerifikasiOutput] = Query(None, description="Filter status QC"),
    limit: int = Query(2000, ge=1, le=5000, description="Batas maksimum baris"),
    offset: int = Query(0, ge=0, description="Lewati N baris pertama"),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.LogOutputBorongan).options(
        joinedload(models.LogOutputBorongan.karyawan),
        joinedload(models.LogOutputBorongan.spk),
        joinedload(models.LogOutputBorongan.mesin),
        joinedload(models.LogOutputBorongan.bahan),
    ).filter(models.LogOutputBorongan.is_deleted == False)

    # 🟢 Filter Rentang Tanggal (Start & End Date) atau Tanggal Tunggal
    if start_date and end_date:
        query = query.filter(models.LogOutputBorongan.tanggal >= start_date, models.LogOutputBorongan.tanggal <= end_date)
    elif start_date:
        query = query.filter(models.LogOutputBorongan.tanggal >= start_date)
    elif end_date:
        query = query.filter(models.LogOutputBorongan.tanggal <= end_date)
    elif tanggal:
        query = query.filter(models.LogOutputBorongan.tanggal == tanggal)

    if karyawan_id:
        query = query.filter(models.LogOutputBorongan.karyawan_id == karyawan_id)
    if spk_id:
        query = query.filter(models.LogOutputBorongan.spk_id == spk_id)
    if kode_mesin:
        query = query.filter(models.LogOutputBorongan.kode_mesin == kode_mesin)
    if status_verifikasi:
        query = query.filter(models.LogOutputBorongan.status_verifikasi == get_enum_val(status_verifikasi))

    # 🟢 Urutkan dari yang terbaru (tanggal terbaru & waktu dibuat terbaru)
    logs = (
        query.order_by(
            models.LogOutputBorongan.tanggal.desc(),
            models.LogOutputBorongan.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    for log in logs:
        _populate_log_details(log)

    return logs


@router.post("/output/{log_id}/delete")
def delete_output_log(
    log_id: int,
    alasan_hapus: Optional[str] = Query("Kesalahan Input Data", description="Alasan pembatalan/penghapusan"),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    log = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.id == log_id,
        models.LogOutputBorongan.is_deleted == False
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail=f"Log output ID #{log_id} tidak ditemukan.")

    if log.is_paid:
        raise HTTPException(
            status_code=400,
            detail="Setoran ini sudah masuk dalam Slip Gaji (PAID) dan tidak dapat dihapus!"
        )

    log.is_deleted = True
    log.deleted_at = datetime.utcnow()
    log.deleted_by = getattr(current_user, "nama", None) or current_user.id_karyawan
    log.alasan_hapus = alasan_hapus

    # Rollback cutting quota
    if log.tahapan_proses == "CUTTING" and log.spk:
        log.spk.realisasi_potong = max(0, log.spk.realisasi_potong - log.qty_pass)

    # Rollback stok bahan baku jika sebelumnya ada pemakaian bahan
    if log.bahan_id and (log.jumlah_bahan_digunakan or 0) > 0:
        bahan = db.query(models.BahanBaku).filter(models.BahanBaku.id == log.bahan_id).first()
        if bahan:
            stok_awal = float(bahan.stok_saat_ini or 0.0)
            stok_akhir = stok_awal + float(log.jumlah_bahan_digunakan)
            bahan.stok_saat_ini = stok_akhir
            bahan.terakhir_diperbarui = datetime.utcnow()

            mutasi_retur = models.LogMutasiBahan(
                bahan_id=bahan.id,
                tanggal=datetime.utcnow(),
                tipe="PENYESUAIAN",
                jumlah=float(log.jumlah_bahan_digunakan),
                stok_sebelum=stok_awal,
                stok_sesudah=stok_akhir,
                referensi_po_spk=f"Rollback Setoran #{log.id} ({log.spk_id})",
                catatan=f"Pengembalian stok bahan karena setoran output #{log.id} dihapus. Alasan: {alasan_hapus}",
                petugas=getattr(current_user, "nama", None) or current_user.id_karyawan
            )
            db.add(mutasi_retur)

    db.commit()

    return {"message": f"Log setoran #{log_id} berhasil dihapus dan stok bahan terkait telah di-rollback.", "log_id": log_id}


# ===========================================================================
# 2️⃣ VERIFIKASI QC (ANTI-SELF VERIFY & AUDIT REVISI)
# ===========================================================================

@router.put("/output/{log_id}/verifikasi", response_model=LogOutputResponse)
def verify_output_log(
    log_id: int,
    payload: LogOutputVerifikasi,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    log = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.id == log_id,
        models.LogOutputBorongan.is_deleted == False
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log output tidak ditemukan.")

    user_role = getattr(current_user, "role", "").upper()
    is_dev_or_owner = user_role in ["DEVELOPER", "OWNER"]

    is_same_worker = (current_user.id_karyawan == log.karyawan_id)
    is_same_petugas = (current_user.nama == log.petugas_input or current_user.id_karyawan == log.petugas_input)

    if not is_dev_or_owner and (is_same_worker or is_same_petugas):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pencegahan Fraud: Anda dilarang memverifikasi hasil kerja atau data inputan Anda sendiri!"
        )

    if log.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Terkunci: Setoran ini sudah masuk dalam rekap pencairan gaji (Paid) dan tidak dapat diubah."
        )

    status_lama = log.status_verifikasi
    status_baru = get_enum_val(payload.status_verifikasi)

    if status_lama in ["APPROVED", "REJECTED"] and status_baru != status_lama:
        audit_entry = models.LogAuditVerifikasiQC(
            log_output_id=log.id,
            status_lama=status_lama,
            status_baru=status_baru,
            alasan_revisi=payload.catatan or "Revisi status verifikasi QC oleh supervisor",
            dieksekusi_oleh=getattr(current_user, "nama", None) or current_user.id_karyawan
        )
        db.add(audit_entry)

    log.status_verifikasi = status_baru
    log.verifier_id = getattr(current_user, "nama", None) or current_user.id_karyawan
    if payload.catatan:
        log.catatan = f"{log.catatan or ''} | QC: {payload.catatan}"
    if payload.foto_bukti_defect:
        log.foto_bukti_defect = payload.foto_bukti_defect

    db.commit()
    db.refresh(log)

    _populate_log_details(log)

    return log


@router.post("/output/bulk-verifikasi")
def bulk_verify_output_logs(
    payload: BulkVerifyRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    logs = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.id.in_(payload.log_ids),
        models.LogOutputBorongan.is_deleted == False,
        models.LogOutputBorongan.is_paid == False
    ).all()

    user_role = getattr(current_user, "role", "").upper()
    is_dev_or_owner = user_role in ["DEVELOPER", "OWNER"]

    verified_count = 0
    skipped_self_verify = 0
    status_baru = get_enum_val(payload.status_verifikasi)
    verifier = getattr(current_user, "nama", None) or current_user.id_karyawan

    for log in logs:
        is_same_worker = (current_user.id_karyawan == log.karyawan_id)
        is_same_petugas = (current_user.nama == log.petugas_input or current_user.id_karyawan == log.petugas_input)

        if not is_dev_or_owner and (is_same_worker or is_same_petugas):
            skipped_self_verify += 1
            continue

        status_lama = log.status_verifikasi
        # Konsisten dengan verify_output_log: revisi dari APPROVED/REJECTED wajib tercatat di audit trail.
        if status_lama in ["APPROVED", "REJECTED"] and status_baru != status_lama:
            db.add(models.LogAuditVerifikasiQC(
                log_output_id=log.id,
                status_lama=status_lama,
                status_baru=status_baru,
                alasan_revisi=payload.catatan or "Revisi status verifikasi QC (bulk) oleh supervisor",
                dieksekusi_oleh=verifier,
            ))

        log.status_verifikasi = status_baru
        log.verifier_id = verifier
        if payload.catatan:
            log.catatan = f"{log.catatan or ''} | Bulk QC: {payload.catatan}"

        verified_count += 1

    db.commit()

    return {
        "message": f"Berhasil memverifikasi {verified_count} log output borongan.",
        "verified_count": verified_count,
        "skipped_self_verify": skipped_self_verify
    }


# ===========================================================================
# 3️⃣ INTEGRASI PAYROLL GAJI BORONGAN
# ===========================================================================

@router.get("/payroll/rekap-unpaid", response_model=List[RekapGajiPekerjaResponse])
def get_rekap_gaji_unpaid(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN", "FINANCE"]))
):
    unpaid_logs = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.status_verifikasi == StatusVerifikasiOutput.APPROVED.value,
        models.LogOutputBorongan.is_paid == False,
        models.LogOutputBorongan.is_deleted == False
    ).order_by(models.LogOutputBorongan.karyawan_id.asc(), models.LogOutputBorongan.tanggal.asc()).all()

    grouped: dict = {}
    for log in unpaid_logs:
        k_id = log.karyawan_id
        if k_id not in grouped:
            grouped[k_id] = {
                "karyawan_id": k_id,
                "nama_karyawan": log.karyawan.nama if log.karyawan else k_id,
                "tipe_pay": log.karyawan.tipe_pay if log.karyawan else "BORONGAN",
                "total_setoran_approved": 0,
                "total_pcs_pass": 0,
                "total_gaji_unpaid_rp": 0.0,
                "total_gaji_paid_rp": 0.0,
                "detail_unpaid_logs": []
            }

        grouped[k_id]["total_setoran_approved"] += 1
        grouped[k_id]["total_pcs_pass"] += log.qty_pass
        grouped[k_id]["total_gaji_unpaid_rp"] += log.subtotal_rp

        grouped[k_id]["detail_unpaid_logs"].append(
            PayrollLogItem(
                log_id=log.id,
                tanggal=log.tanggal,
                spk_id=log.spk_id,
                nama_artikel=log.spk.nama_artikel if log.spk else "-",
                tahapan_proses=log.tahapan_proses,
                qty_pass=log.qty_pass,
                tarif_per_pcs=log.tarif_per_pcs,
                subtotal_rp=log.subtotal_rp
            )
        )

    return list(grouped.values())


@router.post("/payroll/mark-paid")
def mark_payroll_as_paid(
    payload: MarkPayrollPaidRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN", "FINANCE"]))
):
    logs_to_pay = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.karyawan_id.in_(payload.karyawan_ids),
        models.LogOutputBorongan.status_verifikasi == StatusVerifikasiOutput.APPROVED.value,
        models.LogOutputBorongan.is_paid == False,
        models.LogOutputBorongan.is_deleted == False
    ).all()

    if not logs_to_pay:
        raise HTTPException(
            status_code=400,
            detail="Tidak ada transaksi gaji APPROVED berstatus UNPAID yang ditemukan untuk karyawan tersebut."
        )

    paid_time = datetime.utcnow()
    total_nominal_cair = 0.0

    # Rekap per karyawan untuk pencatatan LogPayrollProduksi
    per_worker: dict = {}
    for log in logs_to_pay:
        log.is_paid = True
        log.payroll_id = payload.payroll_id
        log.paid_at = paid_time
        total_nominal_cair += (log.subtotal_rp or 0.0)

        agg = per_worker.setdefault(log.karyawan_id, {"count": 0, "pcs": 0, "rp": 0.0})
        agg["count"] += 1
        agg["pcs"] += (log.qty_pass or 0)
        agg["rp"] += (log.subtotal_rp or 0.0)

    # Konsisten dengan /api/payroll/mark-paid: simpan riwayat pencairan per pekerja.
    for k_id, agg in per_worker.items():
        db.merge(models.LogPayrollProduksi(
            id=f"{payload.payroll_id}-{k_id}",
            karyawan_id=k_id,
            total_setoran_approved=agg["count"],
            total_pcs_pass=agg["pcs"],
            total_nominal_rp=agg["rp"],
            metode_bayar="TRANSFER",
            keterangan=f"Pencairan gaji borongan batch {payload.payroll_id}",
            disetujui_oleh=getattr(current_user, "nama", None) or current_user.id_karyawan,
        ))

    # Audit trail pencairan (actor_id konsisten dgn /api/payroll: pakai id_karyawan)
    db.add(models.LogAudit(
        actor_id=current_user.id_karyawan,
        aksi="PAYROLL_PAID",
        target_id=payload.payroll_id,
        catatan=(
            f"Pencairan {len(logs_to_pay)} setoran borongan untuk {len(per_worker)} pekerja "
            f"(total Rp {total_nominal_cair:,.0f}) oleh {getattr(current_user, 'nama', current_user.id_karyawan)}."
        ),
    ))

    db.commit()

    return {
        "message": f"Berhasil mencairkan {len(logs_to_pay)} transaksi gaji borongan.",
        "payroll_id": payload.payroll_id,
        "total_transaksi_paid": len(logs_to_pay),
        "total_pekerja": len(per_worker),
        "total_nominal_cair_rp": total_nominal_cair
    }