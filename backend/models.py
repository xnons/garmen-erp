# models.py
from sqlalchemy import Column, String, Integer, Boolean
from database import Base

class Karyawan(Base):
    __tablename__ = "karyawan"

    id_karyawan = Column(String, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="PRODUKSI") # OWNER, ADMIN, FINANCE, GUDANG, PRODUKSI
    tipe_pay = Column(String, default="BORONGAN") # BORONGAN, HARIAN, BULANAN
    tarif_borongan_pcs = Column(Integer, default=0)
    
    # Fitur pendukung profil yang baru kita buat
    total_hadir = Column(Integer, default=0)
    total_terlambat = Column(Integer, default=0)
    total_izin = Column(Integer, default=0)
    total_alpa = Column(Integer, default=0)
    poin_pelanggaran = Column(Integer, default=0)