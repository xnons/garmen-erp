from fastapi import APIRouter

router = APIRouter(prefix="/api/security", tags=["System Security Gate"])

# Router Security Gate / Master PIN telah dinonaktifkan 
# sesuai penyederhanaan sistem otorisasi berbasis Role (RBAC).