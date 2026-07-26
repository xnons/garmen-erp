from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
import models
from schemas.inventaris import (
    BahanBakuCreate,
    BahanBakuUpdate,
    BahanBakuResponse,
    LogMutasiCreate,
    LogMutasiResponse,
    KategoriBahan,
    StatusStok,
    TipeMutasi,
    StatusPembayaran
)
from core.security import get_current_user


# ---------------------------------------------------------------------------
# RBAC DEPENDENCY CHECKER
# ---------------------------------------------------------------------------
def require_roles(allowed_roles: List[str]):
    """Dependency untuk membatasi endpoint berdasarkan role JWT user."""
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


# 🔒 Inisialisasi APIRouter dengan Proteksi Kunci (Hanya OWNER, DEVELOPER, ADMIN)
router = APIRouter(
    prefix="/api/inventaris",
    tags=["Inventaris & Stok"],
    dependencies=[Depends(require_roles(["OWNER", "DEVELOPER", "ADMIN"]))]
)


# ---------------------------------------------------------------------------
# HELPER: Kalkulasi Status Stok (AMAN / MENIPIS / HABIS)
# ---------------------------------------------------------------------------
def hitung_status_stok(stok_saat_ini: float, stok_minimum: float) -> StatusStok:
    if stok_saat_ini <= 0:
        return StatusStok.HABIS
    elif stok_saat_ini <= stok_minimum:
        return StatusStok.MENIPIS
    return StatusStok.AMAN


# ---------------------------------------------------------------------------
# 1️⃣ GET ALL INVENTARIS (Search, Filter Kategori & Status Stok)
# ---------------------------------------------------------------------------
@router.get("", response_model=List[BahanBakuResponse])
@router.get("/", response_model=List[BahanBakuResponse])
def get_all_inventaris(
    search: Optional[str] = Query(None, description="Cari Berdasarkan nama item / kode SKU / lokasi"),
    kategori: Optional[KategoriBahan] = Query(None, description="Filter kategori bahan"),
    status_stok: Optional[StatusStok] = Query(None, description="Filter status stok"),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Mengambil semua data inventaris bahan baku dari database dengan fitur Search & Filter.
    """
    query = db.query(models.BahanBaku)

    # Filter Search (Nama Item atau Kode SKU atau Lokasi Gudang)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.BahanBaku.nama_item.ilike(search_filter),
                models.BahanBaku.kode_sku.ilike(search_filter),
                models.BahanBaku.lokasi_gudang.ilike(search_filter)
            )
        )

    # Filter Kategori
    if kategori:
        query = query.filter(models.BahanBaku.kategori == kategori.value)

    items = query.order_by(models.BahanBaku.nama_item.asc()).all()

    # Format Response & Filter Status Stok jika diminta
    results = []
    for item in items:
        computed_status = hitung_status_stok(item.stok_saat_ini, item.stok_minimum)

        # Filter status stok di memory
        if status_stok and computed_status != status_stok:
            continue

        results.append(
            BahanBakuResponse(
                id=item.id,
                kode_sku=item.kode_sku,
                nama_item=item.nama_item,
                kategori=item.kategori,
                satuan=item.satuan,
                stok_saat_ini=item.stok_saat_ini,
                stok_minimum=item.stok_minimum,
                harga_per_satuan=item.harga_per_satuan,
                lokasi_gudang=item.lokasi_gudang,
                supplier_utama=item.supplier_utama,
                warna_kode=item.warna_kode,
                no_faktur_po=item.no_faktur_po,
                tanggal_masuk=item.tanggal_masuk,
                tipe_pembayaran=item.tipe_pembayaran,
                status_pembayaran=item.status_pembayaran,
                jatuh_tempo=item.jatuh_tempo,
                status_stok=computed_status,
                terakhir_diperbarui=item.terakhir_diperbarui.date() if item.terakhir_diperbarui else date.today()
            )
        )

    return results


# ---------------------------------------------------------------------------
# 2️⃣ POST: TAMBAH MASTER BAHAN BAKU BARU
# ---------------------------------------------------------------------------
@router.post("", response_model=BahanBakuResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BahanBakuResponse, status_code=status.HTTP_201_CREATED)
def create_bahan_baku(
    payload: BahanBakuCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Menambah Master Bahan Baku Baru ke Database PostgreSQL & membuat log transaksi awal.
    """
    # Cek Duplikasi Kode SKU
    existing = db.query(models.BahanBaku).filter(models.BahanBaku.kode_sku == payload.kode_sku).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Kode SKU '{payload.kode_sku}' sudah terdaftar di sistem!"
        )

    data_dict = payload.model_dump()
    stok_awal = data_dict.pop("stok_awal", 0.0)

    # Buat Object Model
    new_item = models.BahanBaku(
        id=payload.kode_sku,  # Menggunakan Kode SKU sebagai Primary Key ID
        stok_saat_ini=stok_awal,
        **data_dict
    )
    db.add(new_item)

    # Buat Log Mutasi Perdana Jika Memiliki Stok Awal > 0
    if stok_awal > 0:
        log_perdana = models.LogMutasiBahan(
            bahan_id=new_item.id,
            tipe=TipeMutasi.MASUK.value,
            jumlah=stok_awal,
            stok_sebelum=0.0,
            stok_sesudah=stok_awal,
            referensi_po_spk=payload.no_faktur_po or "STOK_AWAL",
            catatan="Registrasi Stok Perdana Master Barang",
            petugas=current_user.nama
        )
        db.add(log_perdana)

    db.commit()
    db.refresh(new_item)

    computed_status = hitung_status_stok(new_item.stok_saat_ini, new_item.stok_minimum)

    return BahanBakuResponse(
        id=new_item.id,
        kode_sku=new_item.kode_sku,
        nama_item=new_item.nama_item,
        kategori=new_item.kategori,
        satuan=new_item.satuan,
        stok_saat_ini=new_item.stok_saat_ini,
        stok_minimum=new_item.stok_minimum,
        harga_per_satuan=new_item.harga_per_satuan,
        lokasi_gudang=new_item.lokasi_gudang,
        supplier_utama=new_item.supplier_utama,
        warna_kode=new_item.warna_kode,
        no_faktur_po=new_item.no_faktur_po,
        tanggal_masuk=new_item.tanggal_masuk,
        tipe_pembayaran=new_item.tipe_pembayaran,
        status_pembayaran=new_item.status_pembayaran,
        jatuh_tempo=new_item.jatuh_tempo,
        status_stok=computed_status,
        terakhir_diperbarui=new_item.terakhir_diperbarui.date() if new_item.terakhir_diperbarui else date.today()
    )


# ---------------------------------------------------------------------------
# 3️⃣ POST: CATAT MUTASI STOK (MASUK / KELUAR PRODUKSI / PENYESUAIAN / RETUR)
# ---------------------------------------------------------------------------
@router.post("/{item_id}/mutasi", response_model=LogMutasiResponse)
def catat_mutasi_stok(
    item_id: str,
    payload: LogMutasiCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Mencatat transaksi keluar/masuk/opname stok di DB secara permanen & mengalkulasi stok akhir.
    """
    # 1. Cari Item di Database
    item = db.query(models.BahanBaku).filter(models.BahanBaku.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Bahan baku dengan ID '{item_id}' tidak ditemukan.")

    stok_sebelum = item.stok_saat_ini
    stok_sesudah = stok_sebelum

    # 2. Logika Kalkulasi Stok Baru berdasarkan Tipe Mutasi
    if payload.tipe in [TipeMutasi.MASUK, TipeMutasi.RETUR]:
        stok_sesudah = stok_sebelum + payload.jumlah
    elif payload.tipe == TipeMutasi.KELUAR_PRODUKSI:
        if payload.jumlah > stok_sebelum:
            raise HTTPException(
                status_code=400,
                detail=f"Stok tidak mencukupi! Stok saat ini: {stok_sebelum} {item.satuan}"
            )
        stok_sesudah = stok_sebelum - payload.jumlah
    elif payload.tipe == TipeMutasi.PENYESUAIAN:
        stok_sesudah = payload.jumlah  # Stock Opname / Penyesuaian langsung mengatur jumlah akhir

    # Update stok saat ini di DB
    item.stok_saat_ini = stok_sesudah

    # 3. Simpan Log Mutasi ke Database
    new_log = models.LogMutasiBahan(
        bahan_id=item_id,
        tipe=payload.tipe.value,
        jumlah=payload.jumlah,
        stok_sebelum=stok_sebelum,
        stok_sesudah=stok_sesudah,
        referensi_po_spk=payload.referensi_po_spk or "-",
        catatan=payload.catatan or f"Mutasi {payload.tipe.value}",
        petugas=current_user.nama or payload.petugas
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


# ---------------------------------------------------------------------------
# 4️⃣ PUT: UPDATE MASTER BAHAN BAKU
# ---------------------------------------------------------------------------
@router.put("/{item_id}", response_model=BahanBakuResponse)
def update_bahan_baku(
    item_id: str,
    payload: BahanBakuUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Mengubah data master item bahan baku (HPP, Lokasi Rak, Reorder Level, Status Pelunasan).
    """
    item = db.query(models.BahanBaku).filter(models.BahanBaku.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bahan baku tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            # Mengubah Enum menjadi string jika ada
            setattr(item, field, value.value if hasattr(value, 'value') else value)

    db.commit()
    db.refresh(item)

    computed_status = hitung_status_stok(item.stok_saat_ini, item.stok_minimum)

    return BahanBakuResponse(
        id=item.id,
        kode_sku=item.kode_sku,
        nama_item=item.nama_item,
        kategori=item.kategori,
        satuan=item.satuan,
        stok_saat_ini=item.stok_saat_ini,
        stok_minimum=item.stok_minimum,
        harga_per_satuan=item.harga_per_satuan,
        lokasi_gudang=item.lokasi_gudang,
        supplier_utama=item.supplier_utama,
        warna_kode=item.warna_kode,
        no_faktur_po=item.no_faktur_po,
        tanggal_masuk=item.tanggal_masuk,
        tipe_pembayaran=item.tipe_pembayaran,
        status_pembayaran=item.status_pembayaran,
        jatuh_tempo=item.jatuh_tempo,
        status_stok=computed_status,
        terakhir_diperbarui=item.terakhir_diperbarui.date() if item.terakhir_diperbarui else date.today()
    )


# ---------------------------------------------------------------------------
# 5️⃣ GET: RIWAYAT LOG MUTASI PER ITEM
# ---------------------------------------------------------------------------
@router.get("/{item_id}/mutasi", response_model=List[LogMutasiResponse])
def get_riwayat_mutasi_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Mengambil riwayat log mutasi khusus untuk 1 item bahan baku.
    """
    logs = db.query(models.LogMutasiBahan).filter(
        models.LogMutasiBahan.bahan_id == item_id
    ).order_by(models.LogMutasiBahan.tanggal.desc()).all()

    return logs


# ---------------------------------------------------------------------------
# 6️⃣ DELETE: HAPUS BAHAN BAKU
# ---------------------------------------------------------------------------
@router.delete("/{item_id}")
def delete_bahan_baku(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Menghapus master bahan baku beserta riwayat mutasinya.
    """
    item = db.query(models.BahanBaku).filter(models.BahanBaku.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bahan baku tidak ditemukan.")

    nama = item.nama_item
    db.delete(item)
    db.commit()

    return {"message": f"Item '{nama}' ({item_id}) berhasil dihapus."}