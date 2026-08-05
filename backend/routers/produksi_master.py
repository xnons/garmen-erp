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
    PINVerifyRequest,
    DeleteWithPINRequest,
    ProductionAnalyticsDashboard,
    DailyTrendPoint,
    SPKProgressItem,
    DefectRateByTahapan,
    TopWorkerItem,
    StatusSPK,
    StatusVerifikasiOutput
)
from schemas.security import PinUpdateSchema
from core.security import get_current_user, verify_password, get_password_hash


# ===========================================================================
# HELPER & UTILITIES
# ===========================================================================
def get_enum_val(obj):
    """Mendapatkan nilai string dari Enum atau String secara aman."""
    if obj is None:
        return None
    return obj.value if hasattr(obj, 'value') else str(obj)


def require_roles(allowed_roles: List[str]):
    """Dependency RBAC untuk membatasi endpoint berdasarkan role user."""
    def role_checker(current_user: models.Karyawan = Depends(get_current_user)):
        user_role = getattr(current_user, "role", "").upper()
        allowed_uppercase = [r.upper() for r in allowed_roles]
        
        if user_role not in allowed_uppercase:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak! Fitur ini membutuhkan role: {', '.join(allowed_uppercase)}"
            )
        return current_user
    return role_checker


def verify_pin_qc(current_user: models.Karyawan, input_pin: str, db: Session):
    """Validasi PIN Security Khusus Modul Produksi & QC."""
    if not input_pin or len(input_pin) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN Otorisasi QC/Produksi wajib diisi (Min. 4 Digit)!"
        )

    user_role = getattr(current_user, "role", "").upper()

    # 1. Dev Bypass
    if input_pin == "6767" and user_role == "DEVELOPER":
        return True

    # 2. Testing Bypass
    if input_pin == "123456":
        return True

    # 3. Cek pin_qc_hash di SystemSecurity
    sys_sec = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
    current_qc_hash = getattr(sys_sec, 'pin_qc_hash', None) if sys_sec else None

    if current_qc_hash and verify_password(input_pin, current_qc_hash):
        return True
    elif not current_qc_hash and input_pin in ["123456", "1234"]:
        return True

    # 4. Fallback PIN Pribadi Karyawan
    if getattr(current_user, "pin", None) and current_user.pin == input_pin:
        return True

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="PIN Otorisasi QC / Produksi Salah! Akses ditolak."
    )


# Router Master Produksi
router = APIRouter(prefix="/api/produksi", tags=["Produksi - Master & SPK"])


# ===========================================================================
# 0️⃣ PEKERJA & CONFIG PIN QC
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


@router.put("/pin-qc/update")
def update_pin_qc(
    payload: PinUpdateSchema,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN", "PRODUKSI"]))
):
    """Endpoint memperbarui PIN Otorisasi Modul Produksi & QC."""
    sec_record = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
    user_role = getattr(current_user, "role", "").upper()

    current_hash = getattr(sec_record, "pin_qc_hash", None) if sec_record else None
    if not current_hash:
        current_hash = get_password_hash("123456")

    is_dev_bypass = (user_role == "DEVELOPER" and payload.old_pin == "6767")

    if not is_dev_bypass and not verify_password(payload.old_pin, current_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN QC Lama yang Anda masukkan salah!"
        )

    new_qc_hash = get_password_hash(payload.new_pin)

    if not sec_record:
        sec_record = models.SystemSecurity(
            id=1,
            master_pin_hash=get_password_hash("1234"),
            pin_qc_hash=new_qc_hash,
            updated_by=getattr(current_user, "username", "SYSTEM")
        )
        db.add(sec_record)
    else:
        sec_record.pin_qc_hash = new_qc_hash
        sec_record.updated_by = getattr(current_user, "username", "SYSTEM")

    db.commit()

    return {
        "status": "success",
        "message": "PIN Otorisasi Modul Produksi & QC berhasil diperbarui!"
    }


# ===========================================================================
# 1️⃣ MANAJEMEN SPK
# ===========================================================================

@router.post("/spk", response_model=SPKDetailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/spk/", response_model=SPKDetailResponse, status_code=status.HTTP_201_CREATED)
def create_spk(
    payload: SPKCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))
):
    existing = db.query(models.SPKProduksi).filter(models.SPKProduksi.id == payload.id).first()
    if existing:
        if existing.is_deleted:
            raise HTTPException(
                status_code=400,
                detail=f"Kode SPK '{payload.id}' pernah terdaftar dan berstatus terhapus. Gunakan kode baru."
            )
        raise HTTPException(
            status_code=400,
            detail=f"SPK dengan Kode '{payload.id}' sudah terdaftar di sistem!"
        )

    calculated_qty = payload.target_qty
    if payload.size_matrix:
        matrix_sum = sum(payload.size_matrix.values())
        if matrix_sum > 0:
            calculated_qty = matrix_sum

    new_spk = models.SPKProduksi(
        id=payload.id,
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
        jenis_kain=payload.jenis_kain,
        warna_kain=payload.warna_kain,
        aksesoris=payload.aksesoris,
        spesifikasi_sablon_bordir=payload.spesifikasi_sablon_bordir,
        toleransi_defect_pct=payload.toleransi_defect_pct,
        tanggal_mulai=payload.tanggal_mulai,
        target_cutting=payload.target_cutting,
        target_sewing=payload.target_sewing,
        deadline=payload.deadline,
        status=StatusSPK.ON_PROGRESS.value,
        harga_jual_per_pcs=payload.harga_jual_per_pcs,
        is_deleted=False
    )
    db.add(new_spk)

    if payload.tarif_initial:
        for t in payload.tarif_initial:
            tarif_item = models.MasterTarifBorongan(
                spk_id=payload.id,
                tahapan_proses=get_enum_val(t.tahapan_proses),
                tarif_per_pcs=t.tarif_per_pcs,
                keterangan=t.keterangan
            )
            db.add(tarif_item)

    db.commit()
    db.refresh(new_spk)
    return new_spk


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
    payload: PINVerifyRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER"]))
):
    verify_pin_qc(current_user, payload.pin, db)

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
    payload: DeleteWithPINRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["OWNER", "DEVELOPER"]))
):
    verify_pin_qc(current_user, payload.pin, db)

    spk = db.query(models.SPKProduksi).filter(
        models.SPKProduksi.id == spk_id,
        models.SPKProduksi.is_deleted == False
    ).first()
    if not spk:
        raise HTTPException(status_code=404, detail=f"SPK ID '{spk_id}' tidak ditemukan.")

    spk.is_deleted = True
    spk.deleted_at = datetime.utcnow()
    spk.deleted_by = current_user.nama or current_user.id_karyawan
    db.commit()

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

    total_pass = sum(l.qty_pass for l in logs_period)
    total_reject = sum(l.qty_reject for l in logs_period)
    total_disetor = total_pass + total_reject
    defect_rate_avg = (total_reject / total_disetor * 100) if total_disetor > 0 else 0.0
    total_upah = sum(l.subtotal_rp for l in logs_period if l.status_verifikasi == StatusVerifikasiOutput.APPROVED.value)

    daily_grouped: dict = {}
    for l in logs_period:
        d_str = str(l.tanggal)
        if d_str not in daily_grouped:
            daily_grouped[d_str] = {"disetor": 0, "pass": 0, "reject": 0, "upah": 0.0}
        
        daily_grouped[d_str]["disetor"] += l.qty_disetor
        daily_grouped[d_str]["pass"] += l.qty_pass
        daily_grouped[d_str]["reject"] += l.qty_reject
        if l.status_verifikasi == StatusVerifikasiOutput.APPROVED.value:
            daily_grouped[d_str]["upah"] += l.subtotal_rp

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