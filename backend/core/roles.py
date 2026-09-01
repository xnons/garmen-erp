"""
Sumber tunggal daftar Role Karyawan + helper pembacaan role.

Dipakai bersama oleh core.deps.require_roles dan core.security.require_role
(yang kini hanya alias tipis). Belum menerapkan validasi ketat saat register
agar data role lama tidak tiba-tiba ditolak — enforcement bisa menyusul.
"""
from __future__ import annotations
import enum


class Role(str, enum.Enum):
    DEVELOPER = "DEVELOPER"
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    FINANCE = "FINANCE"
    PPIC = "PPIC"
    PRODUKSI = "PRODUKSI"
    GUDANG = "GUDANG"
    CUTTING = "CUTTING"        # dipakai di router cutting_prep
    KARYAWAN = "KARYAWAN"      # default terbatas / offline worker


# Set string kanonik untuk pengecekan cepat.
KNOWN_ROLES: frozenset[str] = frozenset(r.value for r in Role)


def get_role(user) -> str:
    """Ambil role user sebagai string UPPERCASE yang aman (mis. '' jika None)."""
    return str(getattr(user, "role", "") or "").upper()
