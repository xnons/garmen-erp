from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database import get_db
import models
from schemas.produksi import (
    SPKCreate,
    SPKUpdate,
    SPKResponse,
    SPKDetailResponse,
    MasterTarifCreate,
    MasterTarifResponse,
    ProductionAnalyticsDashboard,
    DailyTrendPoint,
    SPKProgressItem,
    DefectRateByTahapan,
    TopWorkerItem,
    StatusSPK,
    StatusVerifikasiOutput
)
from core.security import get_current_user

# 🟢 Import Helper dari deps.py & audit_helper.py
from core.deps import require_roles, get_enum_val
from core.audit_helper import record_audit

# Router Master Produksi
router = APIRouter(prefix="/api/produksi", tags=["Produksi - Master & SPK"])


# ===========================================================================
# 0️⃣ PEKERJA PRODUKSI
# ===========================================================================

@router.get("/karyawan-produksi", response_model=List[dict])
def get_karyawan_produksi(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """Mengambil daftar karyawan aktif khusus Role PRODUKSI."""
    karyawan_list = db.query(models.Karyawan).filter(
        func.upper(models.Karyawan.role) == "PRODUKSI",
        models.Karyawan.is_active == True
    ).order_by(models.Karyawan.nama.asc()).all()

    return [
        {
            "id_karyawan": k.id_karyawan,
            "nama": k.nama,
            "jabatan": k.jabatan,
            "username": k.username
        }
        for k in karyawan_list
    ]


# ===========================================================================
# 1️⃣ MANAJEMEN SPK (Dengan Auto-Generate Kode SPK Kombinasi Brand & Artikel)
# ===========================================================================

@router.post("/spk", response_model=SPKDetailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/spk/", response_model=SPKDetailResponse, status_code=status.HTTP_201_CREATED)
def create_spk(
    payload: SPKCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    # 🟢 Auto-Generate ID SPK Kombinasi: [NoUrut]-[CLIENT]-[ARTIKEL]-[TAHUN] jika belum diatur unik
    spk_id = payload.id
    if not spk_id or spk_id.startswith("383-") or "ARTIKEL" in spk_id.upper():
        clean_client = "".join(c for c in (payload.nama_pemesan or "UMUM") if c.isalnum()).upper()[:6]
        clean_artikel = "".join(c for c in (payload.nama_artikel or "PROD") if c.isalnum()).upper()[:8]
        random_code = int(datetime.utcnow().timestamp()) % 9000 + 1000
        spk_id = f"{random_code}-{clean_client}-{clean_artikel}-{datetime.utcnow().strftime('%Y')}"

    existing = db.query(models.SPKProduksi).filter(models.SPKProduksi.id == spk_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"SPK dengan Kode '{spk_id}' sudah terdaftar di sistem!"
        )

    calculated_qty = payload.target_qty
    if payload.size_matrix:
        matrix_sum = sum(payload.size_matrix.values())
        if matrix_sum > 0:
            calculated_qty = matrix_sum

    new_spk = models.SPKProduksi(
        id=spk_id, 
        nama_pemesan=payload.nama_pemesan,
        kontak_pemesan=payload.kontak_pemesan,
        no_po_buyer=payload.no_po_buyer,
        alamat_pengiriman=payload.alamat_pengiriman,
        nama_artikel=payload.nama_artikel,
        kategori_produk=payload.kategori_produk,
        prioritas=get_enum_val(payload.prioritas),
        deskripsi=payload.deskripsi,
        foto_sampel=payload.foto_sampel,
        size_matrix=payload.size_matrix or {},
        target_qty=calculated_qty,
        realisasi_potong=0,
        tipe_order=payload.tipe_order or "CMT",
        penyedia_kain=payload.penyedia_kain or "CUSTOMER",
        penyedia_aksesoris=payload.penyedia_aksesoris or "CUSTOMER",
        jenis_kain=payload.jenis_kain,
        warna_kain=payload.warna_kain,
        aksesoris=payload.aksesoris,
        spesifikasi_sablon_bordir=payload.spesifikasi_sablon_bordir,
        toleransi_defect_pct=payload.toleransi_defect_pct or 2.0,
        biaya_kain_per_pcs=payload.biaya_kain_per_pcs or 0.0,
        biaya_aksesoris_per_pcs=payload.biaya_aksesoris_per_pcs or 0.0,
        biaya_maklon_luar_per_pcs=payload.biaya_maklon_luar_per_pcs or 0.0,
        konsumsi_kain_per_pcs=payload.konsumsi_kain_per_pcs or 0.0,
        tanggal_mulai=payload.tanggal_mulai,
        target_cutting=payload.target_cutting,
        target_sewing=payload.target_sewing,
        deadline=payload.deadline,
        dp_nominal=payload.dp_nominal or 0.0,
        link_google_drive=payload.link_google_drive,
        status_acc_sampel=payload.status_acc_sampel or "APPROVED",
        status=StatusSPK.ON_PROGRESS.value,
        harga_jual_per_pcs=payload.harga_jual_per_pcs or 0.0,
        is_deleted=False
    )
    db.add(new_spk)

    if payload.tarif_initial:
        for t in payload.tarif_initial:
            tarif_item = models.MasterTarifBorongan(
                spk_id=spk_id,
                tahapan_proses=get_enum_val(t.tahapan_proses),
                tarif_per_pcs=t.tarif_per_pcs,
                keterangan=t.keterangan
            )
            db.add(tarif_item)

    db.commit()
    db.refresh(new_spk)
    return new_spk


# 🟢 Endpoint Khusus Owner / Developer: Selesai SPK Paksa (Owner Lock)
@router.post("/spk/{spk_id}/owner-finish", status_code=status.HTTP_200_OK)
def owner_finish_spk(
    spk_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER"]))
):
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{spk_id}' tidak ditemukan.")

    spk.status = StatusSPK.FINISHED.value
    db.commit()

    actor_name = getattr(current_user, "nama", None) or current_user.id_karyawan
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="OWNER_FINISH_SPK",
        target_id=spk_id,
        catatan=f"SPK '{spk_id}' ({spk.nama_artikel}) diselesaikan paksa oleh {actor_name}."
    )

    return {
        "message": f"SPK '{spk_id}' berhasil diselesaikan secara eksklusif oleh Owner/Developer.",
        "spk_id": spk_id,
        "status": StatusSPK.FINISHED.value
    }


@router.get("/spk", response_model=List[SPKResponse])
@router.get("/spk/", response_model=List[SPKResponse])
def get_all_spk(
    search: Optional[str] = Query(None, description="Cari ID SPK, Nama Artikel, atau Pemesan"),
    status_filter: Optional[StatusSPK] = Query(None, description="Filter status SPK"),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.SPKProduksi).filter(models.SPKProduksi.is_deleted == False)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                models.SPKProduksi.id.ilike(search_fmt),
                models.SPKProduksi.nama_artikel.ilike(search_fmt),
                models.SPKProduksi.nama_pemesan.ilike(search_fmt),
                models.SPKProduksi.no_po_buyer.ilike(search_fmt)
            )
        )

    if status_filter:
        query = query.filter(models.SPKProduksi.status == get_enum_val(status_filter))

    return query.order_by(models.SPKProduksi.created_at.desc()).all()


@router.get("/spk/{spk_id}", response_model=SPKDetailResponse)
def get_spk_detail(
    spk_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{spk_id}' tidak ditemukan.")

    # 🟢 HITUNG OTOMATIS REALISASI POTONG DARI LOG CUTTING YANG APPROVED
    total_cutting_approved = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
        models.LogOutputBorongan.spk_id == spk.id,
        models.LogOutputBorongan.tahapan_proses == "CUTTING",
        models.LogOutputBorongan.status_verifikasi == "APPROVED",
        models.LogOutputBorongan.is_deleted == False
    ).scalar()

    # Perbarui nilai realisasi potong pada objek SPK
    spk.realisasi_potong = total_cutting_approved
    db.commit()
    db.refresh(spk)

    return spk


@router.put("/spk/{spk_id}", response_model=SPKDetailResponse)
def update_spk(
    spk_id: str,
    payload: SPKUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{spk_id}' tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(spk, field, get_enum_val(value))

    if payload.size_matrix:
        matrix_sum = sum(payload.size_matrix.values())
        if matrix_sum > 0:
            spk.target_qty = matrix_sum

    db.commit()
    db.refresh(spk)
    return spk


@router.post("/spk/{spk_id}/archive")
def archive_spk(
    spk_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{spk_id}' tidak ditemukan.")

    spk.status = StatusSPK.ARCHIVED.value
    db.commit()

    return {"message": f"SPK '{spk_id}' berhasil diarsipkan.", "spk_id": spk_id, "status": "ARCHIVED"}


@router.post("/spk/{spk_id}/delete")
def delete_spk(
    spk_id: str,
    alasan_hapus: Optional[str] = Query("Pembatalan SPK", description="Alasan penghapusan"),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{spk_id}' tidak ditemukan.")

    actor_name = getattr(current_user, "nama", None) or current_user.id_karyawan
    spk.is_deleted = True
    spk.deleted_at = datetime.utcnow()
    spk.deleted_by = actor_name
    db.commit()

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="DELETE_SPK",
        target_id=spk_id,
        catatan=f"SPK '{spk_id}' ({spk.nama_artikel}) dihapus oleh {actor_name}. Alasan: {alasan_hapus}"
    )

    return {"message": f"SPK '{spk_id}' berhasil dihapus dari sistem.", "spk_id": spk_id}


# ===========================================================================
# 2️⃣ TARIF BORONGAN & ANALYTICS
# ===========================================================================

@router.post("/spk/{spk_id}/tarif", response_model=MasterTarifResponse)
def set_tarif_borongan(
    spk_id: str,
    payload: MasterTarifCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    if not spk:
        raise HTTPException(status_code=404, detail="SPK tidak ditemukan.")

    tahapan_str = get_enum_val(payload.tahapan_proses)

    existing_tarif = db.query(models.MasterTarifBorongan).filter(
        models.MasterTarifBorongan.spk_id == spk_id,
        models.MasterTarifBorongan.tahapan_proses == tahapan_str
    ).first()

    if existing_tarif:
        existing_tarif.tarif_per_pcs = payload.tarif_per_pcs
        existing_tarif.keterangan = payload.keterangan
        db.commit()
        db.refresh(existing_tarif)
        return existing_tarif

    new_tarif = models.MasterTarifBorongan(
        spk_id=spk_id,
        tahapan_proses=tahapan_str,
        tarif_per_pcs=payload.tarif_per_pcs,
        keterangan=payload.keterangan
    )
    db.add(new_tarif)
    db.commit()
    db.refresh(new_tarif)
    return new_tarif


@router.get("/analytics", response_model=ProductionAnalyticsDashboard)
def get_production_analytics(
    start_date: Optional[date] = Query(None, description="Awal tanggal filter analitik"),
    end_date: Optional[date] = Query(None, description="Akhir tanggal filter analitik"),
    spk_id: Optional[str] = Query(None, description="Filter spesifik Projek / SPK"),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    today = date.today()
    p_start = start_date or (today - timedelta(days=30))
    p_end = end_date or today

    query_logs = db.query(models.LogOutputBorongan).filter(
        models.LogOutputBorongan.tanggal >= p_start,
        models.LogOutputBorongan.tanggal <= p_end,
        models.LogOutputBorongan.is_deleted == False
    )

    if spk_id:
        query_logs = query_logs.filter(models.LogOutputBorongan.spk_id == spk_id)

    logs_period = query_logs.all()

    total_pass = sum((l.qty_pass or 0) for l in logs_period)
    total_reject = sum((l.qty_reject or 0) for l in logs_period)
    total_disetor = total_pass + total_reject
    defect_rate_avg = (total_reject / total_disetor * 100) if total_disetor > 0 else 0.0
    total_upah = sum((l.subtotal_rp or 0.0) for l in logs_period if l.status_verifikasi == StatusVerifikasiOutput.APPROVED.value)

    daily_grouped: dict = {}
    for l in logs_period:
        d_str = str(l.tanggal)
        if d_str not in daily_grouped:
            daily_grouped[d_str] = {"disetor": 0, "pass": 0, "reject": 0, "upah": 0.0}
        
        daily_grouped[d_str]["disetor"] += (l.qty_disetor or 0)
        daily_grouped[d_str]["pass"] += (l.qty_pass or 0)
        daily_grouped[d_str]["reject"] += (l.qty_reject or 0)
        if l.status_verifikasi == StatusVerifikasiOutput.APPROVED.value:
            daily_grouped[d_str]["upah"] += (l.subtotal_rp or 0.0)

    trend_harian = [
        DailyTrendPoint(
            tanggal=k,
            total_pcs_disetor=v["disetor"],
            total_pcs_pass=v["pass"],
            total_pcs_reject=v["reject"],
            total_upah_rp=v["upah"]
        )
        for k, v in sorted(daily_grouped.items())
    ]

    query_spk = db.query(models.SPKProduksi).filter(models.SPKProduksi.is_deleted == False)
    if spk_id:
        query_spk = query_spk.filter(models.SPKProduksi.id == spk_id)

    active_spks = query_spk.all()
    progress_spk = []
    
    for s in active_spks:
        cutting_approved = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
            models.LogOutputBorongan.spk_id == s.id,
            models.LogOutputBorongan.tahapan_proses == "CUTTING",
            models.LogOutputBorongan.status_verifikasi == StatusVerifikasiOutput.APPROVED.value,
            models.LogOutputBorongan.is_deleted == False
        ).scalar()

        sewing_qty = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
            models.LogOutputBorongan.spk_id == s.id,
            models.LogOutputBorongan.tahapan_proses == "SEWING",
            models.LogOutputBorongan.status_verifikasi == StatusVerifikasiOutput.APPROVED.value,
            models.LogOutputBorongan.is_deleted == False
        ).scalar()

        packing_qty = db.query(func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)).filter(
            models.LogOutputBorongan.spk_id == s.id,
            models.LogOutputBorongan.tahapan_proses == "PACKING",
            models.LogOutputBorongan.status_verifikasi == StatusVerifikasiOutput.APPROVED.value,
            models.LogOutputBorongan.is_deleted == False
        ).scalar()

        total_target_3_stages = (s.target_qty * 3) if s.target_qty > 0 else 1
        total_realisasi = cutting_approved + sewing_qty + packing_qty
        pct_overall = (total_realisasi / total_target_3_stages) * 100

        progress_spk.append(
            SPKProgressItem(
                spk_id=s.id,
                nama_artikel=s.nama_artikel,
                target_qty=s.target_qty,
                realisasi_potong=s.realisasi_potong,
                progress_sewing=sewing_qty,
                progress_packing=packing_qty,
                persentase_selesai=round(min(pct_overall, 100.0), 1),
                status=s.status
            )
        )

    tahapan_grouped: dict = {}
    for l in logs_period:
        t_name = l.tahapan_proses
        if t_name not in tahapan_grouped:
            tahapan_grouped[t_name] = {"disetor": 0, "reject": 0}
        tahapan_grouped[t_name]["disetor"] += l.qty_disetor
        tahapan_grouped[t_name]["reject"] += l.qty_reject

    defect_breakdown = [
        DefectRateByTahapan(
            tahapan_proses=k,
            total_disetor=v["disetor"],
            total_reject=v["reject"],
            defect_rate_pct=round((v["reject"] / v["disetor"] * 100) if v["disetor"] > 0 else 0.0, 1)
        )
        for k, v in tahapan_grouped.items()
    ]

    worker_grouped: dict = {}
    for l in logs_period:
        k_id = l.karyawan_id
        if k_id not in worker_grouped:
            worker_grouped[k_id] = {
                "nama": l.karyawan.nama if l.karyawan else k_id,
                "pass": 0,
                "upah": 0.0
            }
        worker_grouped[k_id]["pass"] += l.qty_pass
        if l.status_verifikasi == StatusVerifikasiOutput.APPROVED.value:
            worker_grouped[k_id]["upah"] += l.subtotal_rp

    top_workers = sorted(
        [
            TopWorkerItem(
                karyawan_id=k,
                nama_karyawan=v["nama"],
                total_pcs_pass=v["pass"],
                total_pendapatan_rp=v["upah"]
            )
            for k, v in worker_grouped.items()
        ],
        key=lambda x: x.total_pcs_pass,
        reverse=True
    )[:5]

    return ProductionAnalyticsDashboard(
        period_start=p_start,
        period_end=p_end,
        total_output_pass=total_pass,
        total_output_reject=total_reject,
        average_defect_rate=round(defect_rate_avg, 2),
        total_upah_borongan=total_upah,
        trend_harian=trend_harian,
        progress_spk=progress_spk,
        defect_breakdown=defect_breakdown,
        top_workers=top_workers
    )