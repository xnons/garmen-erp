import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
from schemas.mesin import MesinCreate, MesinUpdate, MesinResponse
from core.security import get_current_user

router = APIRouter(prefix="/api/mesin", tags=["Management Mesin"])

# Helper Generator Kode Mesin
def generate_kode_mesin(kategori: str, db: Session) -> str:
    prefix = kategori[:3].upper() if kategori else "MSN"
    while True:
        angka = "".join(random.choices(string.digits, k=3))
        candidate = f"MSN-{prefix}-{angka}"
        if not db.query(models.Mesin).filter(models.Mesin.kode_mesin == candidate).first():
            return candidate

# 1. GET ALL MESIN
@router.get("", response_model=List[MesinResponse])
def get_all_mesin(
    status_filter: Optional[str] = None,
    line_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    query = db.query(models.Mesin).options(joinedload(models.Mesin.operator))
    
    if status_filter:
        query = query.filter(models.Mesin.status == status_filter.upper())
    if line_filter:
        query = query.filter(models.Mesin.lokasi_line == line_filter)
        
    mesin_list = query.all()
    
    # Map operator name if available
    result = []
    for m in mesin_list:
        m_dict = MesinResponse.from_orm(m)
        if m.operator:
            m_dict.nama_operator = m.operator.nama
        result.append(m_dict)
        
    return result

# 2. CREATE MESIN BARU (Khusus DEVELOPER, OWNER, ADMIN, PRODUKSI)
@router.post("", status_code=status.HTTP_201_CREATED)
def create_mesin(
    payload: MesinCreate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role.upper() not in ["DEVELOPER", "OWNER", "ADMIN", "PRODUKSI"]:
        raise HTTPException(status_code=403, detail="Akses ditolak!")

    kode = payload.kode_mesin or generate_kode_mesin(payload.kategori, db)
    
    mesin_baru = models.Mesin(
        kode_mesin=kode,
        nama_mesin=payload.nama_mesin,
        kategori=payload.kategori.upper(),
        merk_tipe=payload.merk_tipe,
        lokasi_line=payload.lokasi_line,
        status=(payload.status or "OPERASIONAL").upper(),
        operator_id=payload.operator_id,
        keterangan=payload.keterangan
    )
    db.add(mesin_baru)
    db.commit()
    db.refresh(mesin_baru)
    return {"message": f"Mesin {mesin_baru.nama_mesin} ({kode}) berhasil didaftarkan!"}

# 3. UPDATE MESIN / STATUS MAINTENANCE
@router.put("/{kode_mesin}")
def update_mesin(
    kode_mesin: str,
    payload: MesinUpdate,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    mesin = db.query(models.Mesin).filter(models.Mesin.kode_mesin == kode_mesin).first()
    if not mesin:
        raise HTTPException(status_code=404, detail="Mesin tidak ditemukan!")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key in ["kategori", "status"] and value:
            setattr(mesin, key, value.upper())
        else:
            setattr(mesin, key, value)

    db.commit()
    return {"message": f"Data mesin {kode_mesin} berhasil diperbarui!"}

# 4. DELETE MESIN
@router.delete("/{kode_mesin}")
def delete_mesin(
    kode_mesin: str,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    if current_user.role.upper() not in ["DEVELOPER", "OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Hanya Admin/Owner yang dapat menghapus mesin!")

    mesin = db.query(models.Mesin).filter(models.Mesin.kode_mesin == kode_mesin).first()
    if not mesin:
        raise HTTPException(status_code=404, detail="Mesin tidak ditemukan!")

    db.delete(mesin)
    db.commit()
    return {"message": f"Mesin {kode_mesin} telah dihapus dari inventaris!"}