from typing import List
from fastapi import Depends, HTTPException, status
import models
from core.security import get_current_user

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