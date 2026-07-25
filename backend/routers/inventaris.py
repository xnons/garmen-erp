from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from schemas.inventaris import (
    BahanBakuCreate, BahanBakuUpdate, BahanBakuResponse,
    LogMutasiCreate, LogMutasiResponse, KategoriBahan, StatusStok, TipeMutasi
)
# Assuming database session dependency from app.database import get_db

router = APIRouter(prefix="/api/inventaris", tags=["Inventaris & Stok"])

@router.get("", response_model=List[BahanBakuResponse])
def get_all_inventaris(
    search: Optional[str] = None,
    kategori: Optional[str] = None,
    status_stok: Optional[str] = None,
    # db: Session = Depends(get_db)
):
    """
    Mengambil semua data inventaris dengan pencarian & filter kategori/status.
    """
    # Logic database query (contoh Mock Response):
    results = [] 
    return results


@router.post("", response_model=BahanBakuResponse, status_code=status.HTTP_201_CREATED)
def create_bahan_baku(payload: BahanBakuCreate):
    """
    Menambah Master Bahan Baku Baru ke Database.
    """
    stok_status = StatusStok.HABIS if payload.stok_awal == 0 else (
        StatusStok.MENIPIS if payload.stok_awal <= payload.stok_minimum else StatusStok.AMAN
    )

    # Simpan ke DB
    new_item = {
        "id": f"ITEM-{date.today().strftime('%Y%m%d%H%M%S')}",
        "kode_sku": payload.kode_sku,
        "nama_item": payload.nama_item,
        "kategori": payload.kategori,
        "satuan": payload.satuan,
        "stok_saat_ini": payload.stok_awal,
        "stok_minimum": payload.stok_minimum,
        "harga_per_satuan": payload.harga_per_satuan,
        "lokasi_gudang": payload.lokasi_gudang,
        "supplier_utama": payload.supplier_utama,
        "warna_kode": payload.warna_kode,
        "status_stok": stok_status,
        "terakhir_diperbarui": date.today()
    }
    return new_item


@router.post("/{item_id}/mutasi", response_model=LogMutasiResponse)
def catat_mutasi_stok(item_id: str, payload: LogMutasiCreate):
    """
    Mencatat transaksi keluar/masuk/opname stok & secara otomatis kalkulasi stok akhir.
    """
    # 1. Cari item di database (Contoh Simulasi):
    stok_saat_ini = 100.0  # mock value dari db
    stok_minimum = 20.0

    # 2. Kalkulasi Stok Baru
    stok_sebelum = stok_saat_ini
    stok_sesudah = stok_sebelum

    if payload.tipe in [TipeMutasi.MASUK, TipeMutasi.RETUR]:
        stok_sesudah = stok_sebelum + payload.jumlah
    elif payload.tipe == TipeMutasi.KELUAR_PRODUKSI:
        if payload.jumlah > stok_sebelum:
            raise HTTPException(
                status_code=400, 
                detail=f"Stok tidak mencukupi! Stok saat ini: {stok_sebelum}"
            )
        stok_sesudah = stok_sebelum - payload.jumlah
    elif payload.tipe == TipeMutasi.PENYESUAIAN:
        stok_sesudah = payload.jumlah

    # 3. Update Status Stok
    new_status = StatusStok.HABIS if stok_sesudah == 0 else (
        StatusStok.MENIPIS if stok_sesudah <= stok_minimum else StatusStok.AMAN
    )

    # 4. Return Log Response
    return {
        "id": f"TRX-{date.today().strftime('%Y%m%d%H%M%S')}",
        "item_id": item_id,
        "tanggal": date.today(),
        "tipe": payload.tipe,
        "jumlah": payload.jumlah,
        "stok_sebelum": stok_sebelum,
        "stok_sesudah": stok_sesudah,
        "referensi_po_spk": payload.referensi_po_spk or "-",
        "catatan": payload.catatan or "Mutasi Stok",
        "petugas": payload.petugas or "Admin Gudang"
    }


@router.put("/{item_id}", response_model=BahanBakuResponse)
def update_bahan_baku(item_id: str, payload: BahanBakuUpdate):
    """
    Mengubah data master item bahan baku (HPP, Lokasi Rak, Reorder Level).
    """
    # Logic update DB
    pass