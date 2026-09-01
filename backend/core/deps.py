from typing import List
from fastapi import Depends, HTTPException, status
import models
from core.security import get_current_user
from core.roles import get_role

# Re-export agar `from core.deps import get_role` juga tersedia.
__all__ = ["get_enum_val", "require_roles", "get_role"]


def get_enum_val(obj):
    """Mendapatkan nilai string dari Enum atau String secara aman."""
    if obj is None:
        return None
    return obj.value if hasattr(obj, 'value') else str(obj)


def require_roles(allowed_roles: List[str]):
    """
    Satu-satunya implementasi RBAC dependency untuk seluruh backend.
    core.security.require_role kini hanya alias tipis ke fungsi ini.
    """
    allowed_uppercase = [r.upper() for r in allowed_roles]

    def role_checker(current_user: models.Karyawan = Depends(get_current_user)):
        if get_role(current_user) not in allowed_uppercase:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak! Fitur ini membutuhkan role: {', '.join(allowed_uppercase)}"
            )
        return current_user
    return role_checker
