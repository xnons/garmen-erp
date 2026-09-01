import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

# Import koneksi DB & Models
from database import get_db
import models

# --- KONFIGURASI JWT ---
# Terima SECRET_KEY atau alias JWT_SECRET_KEY. Di produksi (DEV_MODE != true)
# secret WAJIB diisi — jika kosong server sengaja gagal start (fail fast) agar
# token tidak bisa dipalsukan memakai secret default yang diketahui publik.
_DEV_MODE = os.getenv("DEV_MODE", "false").strip().lower() == "true"
SECRET_KEY = (os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or "").strip()

if not SECRET_KEY:
    if _DEV_MODE:
        SECRET_KEY = "DEV_ONLY_INSECURE_SECRET_" + secrets.token_hex(8)
        print("[security] WARNING: SECRET_KEY kosong - memakai secret dev sementara (DEV_MODE=true).")
    else:
        raise RuntimeError(
            "CRITICAL: SECRET_KEY (atau JWT_SECRET_KEY) belum diisi di environment. "
            "Set nilai acak panjang di produksi, atau set DEV_MODE=true untuk lokal."
        )

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- HASHING PASSWORD ---
def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# --- TOKEN CREATION ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- DEPENDENCIES AUTHENTICATION ---
def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> models.Karyawan:
    """Membaca token JWT dan mengembalikan Objek User/Karyawan dari Database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token autentikasi tidak valid atau sudah kadaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Ambil user dari Database berdasarkan username
    user = db.query(models.Karyawan).filter(models.Karyawan.username == username).first()
    if user is None:
        raise credentials_exception

    return user

def get_current_user_role(token: str = Depends(oauth2_scheme)) -> str:
    """Membaca role user langsung dari payload token JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Kredensial tidak valid"
            )
        return role
    except JWTError:  # 💡 Dibereskan: menggunakan JWTError bawaan jose
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Sesi masuk telah berakhir, silakan login ulang."
        )
# --- RBAC ROLE GUARD DEPENDENCY ---
# Implementasi kanonik ada di core.deps.require_roles. `require_role` dipertahankan
# sebagai alias tipis demi kompatibilitas import lama (8 router memakainya).
# Import lokal di dalam fungsi untuk menghindari circular import
# (core.deps mengimpor get_current_user dari modul ini).
def require_role(allowed_roles: list[str]):
    """Alias ke core.deps.require_roles. Gunakan require_roles untuk kode baru."""
    from core.deps import require_roles
    return require_roles(allowed_roles)