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

# Akun sistem/manajerial — sama sekali di luar payroll pabrik.
SYSTEM_ROLES = ["DEVELOPER", "OWNER", "ADMIN", "FINANCE"]

# Staf pendukung bergaji BULANAN yang tidak pernah dibayar per-pcs. Mereka
# TIDAK boleh jadi operator entri upah borongan / muncul di dropdown pemilih
# pekerja borongan — TAPI gaji pokok mereka nyata, jadi tetap ikut di rekap &
# pencairan payroll.
NON_BORONGAN_ROLES = ["PPIC", "QC_INSPECTOR", "GUDANG"]

# Siapa pun yang tidak boleh dicatat sebagai buruh borongan.
_NOT_BORONGAN_WORKER = SYSTEM_ROLES + NON_BORONGAN_ROLES

# Alias kompatibilitas (dulu satu daftar dipakai untuk semua hal).
NON_WORKER_ROLES = _NOT_BORONGAN_WORKER


def is_non_worker_role(role: Optional[str]) -> bool:
    """True kalau role tidak boleh dicatat sebagai operator upah borongan."""
    return bool(role) and role.strip().upper() in _NOT_BORONGAN_WORKER


def _exclude_roles(query, roles):
    """Karyawan dengan role NULL tetap disertakan (buruh lama tanpa role)."""
    return query.filter(or_(
        models.Karyawan.role.is_(None),
        func.upper(func.trim(models.Karyawan.role)).notin_(roles),
    ))


def exclude_worker_picker(query):
    """Untuk dropdown pemilih pekerja borongan: buang akun sistem + staf non-borongan."""
    return _exclude_roles(query, _NOT_BORONGAN_WORKER)


def exclude_non_workers(query):
    """Untuk rekap & pencairan payroll: hanya buang akun sistem/manajerial.
    Staf bulanan (PPIC/QC_INSPECTOR/GUDANG) TETAP disertakan."""
    return _exclude_roles(query, SYSTEM_ROLES)


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
