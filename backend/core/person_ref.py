"""Referensi orang (operator/pekerja) yang dipakai lintas modul produksi.

Tujuan: menutup celah "akun sistem tercatat sebagai buruh borongan".
Dipakai oleh routers/finishing_shipping.py, cutting_prep.py, karyawan.py,
payroll.py.
"""
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models

# Role akun sistem/manajerial/pendukung yang BUKAN buruh produksi borongan.
# Akun ber-role ini tidak boleh: muncul di dropdown pemilih pekerja, dijadikan
# operator entri upah borongan, atau ikut dihitung di rekap payroll borongan.
# PPIC (planner), QC_INSPECTOR (inspektur mutu) dan GUDANG (staf gudang) tidak
# pernah dibayar per-pcs — mereka staf bulanan, jadi diperlakukan sama seperti
# ADMIN/FINANCE untuk modul ini.
NON_WORKER_ROLES = [
    "DEVELOPER", "OWNER", "ADMIN", "FINANCE",
    "PPIC", "QC_INSPECTOR", "GUDANG",
]


def is_non_worker_role(role: Optional[str]) -> bool:
    return bool(role) and role.strip().upper() in NON_WORKER_ROLES


def exclude_non_workers(query):
    """Filter query atas models.Karyawan: buang akun sistem/manajerial.
    Karyawan dengan role NULL tetap disertakan (buruh lama tanpa role)."""
    return query.filter(or_(
        models.Karyawan.role.is_(None),
        func.upper(func.trim(models.Karyawan.role)).notin_(NON_WORKER_ROLES),
    ))


def resolve_worker(
    db: Session,
    worker_id: Optional[str],
    *,
    field: str = "Pekerja",
    required: bool = True,
) -> Optional[models.Karyawan]:
    """Validasi worker_id -> Karyawan.

    - kosong & required        -> 422
    - tidak ditemukan          -> 422
    - nonaktif / diarsipkan    -> 422
    - role sistem/manajerial   -> 422 (akun dev/owner/admin/finance bukan buruh)

    Return objek Karyawan, atau None kalau (not required) & worker_id kosong.
    Tidak pernah mem-fallback ke user yang sedang login.
    """
    if not worker_id:
        if required:
            raise HTTPException(status_code=422, detail=f"{field} wajib dipilih.")
        return None

    obj = db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == worker_id).first()
    if not obj:
        raise HTTPException(
            status_code=422,
            detail=f"{field} yang dipilih tidak ditemukan di master karyawan.",
        )
    if not obj.is_active:
        raise HTTPException(
            status_code=422,
            detail=f"{field} '{obj.nama}' berstatus nonaktif/diarsipkan.",
        )
    if is_non_worker_role(obj.role):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Akun '{obj.nama}' ber-role {obj.role} adalah akun sistem/"
                f"manajerial, bukan pekerja produksi — tidak bisa dicatat "
                f"sebagai operator borongan."
            ),
        )
    return obj


def person_name(rel_obj, rel_id=None) -> Optional[str]:
    """Nama orang untuk ditampilkan. TIDAK PERNAH fallback ke user yang login."""
    if rel_obj is not None:
        return rel_obj.nama
    if rel_id:
        return "(pekerja tidak terdaftar)"
    return None
