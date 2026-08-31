from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, timedelta

from database import get_db
import models

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview-stats")
def get_overview_stats(db: Session = Depends(get_db)):
    today = date.today()

    # 1. Total Output Produksi Hari Ini (LogOutputBorongan + CuttingRecord + PieceRateWage)
    total_output_today = 0
    try:
        legacy_output = db.query(
            func.coalesce(func.sum(models.LogOutputBorongan.qty_pass), 0)
        ).filter(
            cast(models.LogOutputBorongan.tanggal, Date) == today,
            models.LogOutputBorongan.is_deleted == False
        ).scalar() or 0

        cutting_today = db.query(
            func.coalesce(func.sum(models.CuttingRecord.total_qty_cut), 0)
        ).scalar() or 0

        total_output_today = legacy_output + cutting_today
    except Exception:
        total_output_today = 0

    # 2. Total Aset Material Gudang & Count SKU (BahanBaku + InventoryItem Roll Kain & Aksesoris)
    total_aset_material = 0.0
    total_sku_count = 0
    try:
        legacy_aset = db.query(
            func.coalesce(func.sum(models.BahanBaku.stok_saat_ini * models.BahanBaku.harga_per_satuan), 0.0)
        ).scalar() or 0.0
        legacy_sku = db.query(func.count(models.BahanBaku.id)).scalar() or 0

        inv_sku = db.query(func.count(models.InventoryItem.id)).scalar() or 0
        inv_aset = db.query(
            func.coalesce(func.sum(models.InventoryItem.total_stock_yards * models.InventoryItem.unit_price), 0.0)
        ).scalar() or 0.0

        total_aset_material = legacy_aset + inv_aset
        total_sku_count = legacy_sku + inv_sku
    except Exception:
        total_aset_material = 0.0
        total_sku_count = 0

    # 3. Status Mesin Jahit
    mesin_total = 0
    mesin_siap = 0
    mesin_perlu_service = 0
    try:
        mesin_total = db.query(func.count(models.Mesin.id)).scalar() or 0
        mesin_siap = db.query(func.count(models.Mesin.id)).filter(
            func.upper(models.Mesin.status).in_(['OPERASIONAL', 'SIAP'])
        ).scalar() or 0
        mesin_perlu_service = mesin_total - mesin_siap
    except Exception:
        pass

    # 4. Total Karyawan Aktif
    total_karyawan = 0
    try:
        total_karyawan = db.query(func.count(models.Karyawan.id_karyawan)).filter(
            models.Karyawan.is_active == True
        ).scalar() or 0
    except Exception:
        pass

    # 5. Upah Borongan Hari Ini
    upah_hari_ini = 0.0
    try:
        legacy_upah = db.query(
            func.coalesce(func.sum(models.LogOutputBorongan.subtotal_rp), 0.0)
        ).filter(
            cast(models.LogOutputBorongan.tanggal, Date) == today,
            models.LogOutputBorongan.is_deleted == False
        ).scalar() or 0.0

        garment_upah = db.query(
            func.coalesce(func.sum(models.PieceRateWage.total_wage), 0.0)
        ).scalar() or 0.0

        upah_hari_ini = legacy_upah + garment_upah
    except Exception:
        pass

    # 6. Sales Order Aktif
    so_aktif_count = 0
    try:
        so_aktif_count = db.query(func.count(models.SalesOrder.id)).filter(
            models.SalesOrder.status != "COMPLETED"
        ).scalar() or 0
    except Exception:
        so_aktif_count = 0

    return {
        "totalOutputToday": int(total_output_today),
        "targetQuotaToday": 1000,
        "totalAsetMaterial": float(total_aset_material),
        "totalSkuCount": int(total_sku_count),
        "mesinSiap": int(mesin_siap),
        "mesinTotal": int(mesin_total),
        "mesinPerluService": int(mesin_perlu_service),
        "presensiHadir": 0,
        "presensiTotal": int(total_karyawan),
        "totalKaryawan": int(total_karyawan),
        "skorKepatuhan": 100,
        "upahHariIni": float(upah_hari_ini),
        "soAktifCount": int(so_aktif_count)
    }


@router.get("/chart-produksi")
def get_chart_produksi(db: Session = Depends(get_db)):
    try:
        nama_hari_map = {
            'Monday': 'Senin', 'Tuesday': 'Selasa', 'Wednesday': 'Rabu',
            'Thursday': 'Kamis', 'Friday': 'Jumat', 'Saturday': 'Sabtu', 'Sunday': 'Minggu'
        }
        today = date.today()
        seven_days_ago = today - timedelta(days=6)

        results = db.query(
            cast(models.LogOutputBorongan.tanggal, Date).label('tgl'),
            func.sum(models.LogOutputBorongan.qty_pass).label('total_pcs')
        ).filter(
            cast(models.LogOutputBorongan.tanggal, Date) >= seven_days_ago,
            models.LogOutputBorongan.is_deleted == False
        ).group_by(cast(models.LogOutputBorongan.tanggal, Date))\
         .order_by(cast(models.LogOutputBorongan.tanggal, Date).asc()).all()

        db_dict = {r.tgl: r.total_pcs for r in results}
        chart_data = []

        for i in range(7):
            current_date = seven_days_ago + timedelta(days=i)
            day_name = nama_hari_map.get(current_date.strftime('%A'), current_date.strftime('%A'))
            chart_data.append({
                "hari": day_name,
                "pcs": int(db_dict.get(current_date, 0)),
                "target": 1000
            })

        return chart_data
    except Exception:
        return []


@router.get("/chart-brand-material")
def get_chart_brand_material(db: Session = Depends(get_db)):
    """
    🟢 Membaca Nama Client / Buyer dari SPKProduksi dan Menghitung Persentase Porsi Project
    """
    try:
        # Ambil SPK yang aktif (tidak dihapus)
        results = db.query(
            models.SPKProduksi.nama_pemesan,
            func.sum(models.SPKProduksi.target_qty).label('total_qty')
        ).filter(
            models.SPKProduksi.is_deleted == False
        ).group_by(models.SPKProduksi.nama_pemesan).all()

        total_qty_semua = sum([r.total_qty or 0 for r in results]) or 1

        chart_data = []
        for r in results:
            client_name = r.nama_pemesan.strip() if r.nama_pemesan and r.nama_pemesan.strip() else 'Umum / Tanpa Brand'
            qty_val = r.total_qty or 0
            persentase = round((qty_val / total_qty_semua) * 100)
            chart_data.append({"name": client_name, "value": persentase})

        # Jika belum ada data SPK di database, fallback ke Kategori Bahan Baku
        if not chart_data:
            inv_results = db.query(
                models.BahanBaku.kategori,
                func.sum(models.BahanBaku.stok_saat_ini).label('total_stok')
            ).group_by(models.BahanBaku.kategori).all()

            total_stok = sum([r.total_stok or 0 for r in inv_results]) or 1
            for r in inv_results:
                b_name = str(r.kategori).strip() if r.kategori else 'Bahan Baku Lainnya'
                chart_data.append({"name": b_name, "value": round(((r.total_stok or 0) / total_stok) * 100)})

        return chart_data
    except Exception:
        return []


@router.get("/chart-payroll")
def get_chart_payroll(db: Session = Depends(get_db)):
    try:
        total_gaji_pokok = db.query(
            func.coalesce(func.sum(models.Karyawan.gaji_pokok), 0)
        ).filter(models.Karyawan.is_active == True).scalar() or 0

        pokok_per_pekan = float(total_gaji_pokok) / 4 if total_gaji_pokok else 0

        upah_borongan_total = db.query(
            func.coalesce(func.sum(models.LogOutputBorongan.subtotal_rp), 0)
        ).filter(
            models.LogOutputBorongan.is_deleted == False,
            models.LogOutputBorongan.status_verifikasi == "APPROVED"
        ).scalar() or 0

        return [
            {"minggu": "M-1", "borongan": 0.0, "pokok": pokok_per_pekan},
            {"minggu": "M-2", "borongan": 0.0, "pokok": pokok_per_pekan},
            {"minggu": "M-3", "borongan": 0.0, "pokok": pokok_per_pekan},
            {"minggu": "M-4 (Run)", "borongan": float(upah_borongan_total), "pokok": pokok_per_pekan},
        ]
    except Exception:
        return []