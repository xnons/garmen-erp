import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
import models
from core.security import get_password_hash

def clean_database():
    db = SessionLocal()
    try:
        print("[1/7] Menghapus Log Audit QC & Output...")
        db.query(models.LogAuditVerifikasiQC).delete()
        db.query(models.LogOutputBorongan).delete()

        print("[2/7] Menghapus Tarif Borongan & SPK Produksi...")
        db.query(models.MasterTarifBorongan).delete()
        db.query(models.SPKProduksi).delete()

        print("[3/7] Menghapus Log Mutasi & Bahan Baku...")
        db.query(models.LogMutasiBahan).delete()
        db.query(models.BahanBaku).delete()

        print("[4/7] Menghapus Mesin...")
        db.query(models.Mesin).delete()

        print("[5/7] Menghapus Log Sanksi, Payroll, Audit, & Login...")
        db.query(models.LogPelanggaran).delete()
        db.query(models.LogPayrollProduksi).delete()
        db.query(models.LogAudit).delete()
        db.query(models.LogLogin).delete()

        print("[6/7] Menyiapkan Akun Developer...")
        dev_user = db.query(models.Karyawan).filter(models.Karyawan.username == 'developer').first()
        if not dev_user:
            dev_user = models.Karyawan(
                id_karyawan='DEV-001',
                nama='Developer Utama',
                username='developer',
                hashed_password=get_password_hash('DevSecret123!'),
                role='DEVELOPER',
                jabatan='System Developer',
                status_karyawan='TETAP',
                is_active=True,
                tipe_pay='BULANAN',
                gaji_pokok=15000000,
                pin='6767',
                total_hadir=30,
                total_terlambat=0,
                total_izin=0,
                total_alpa=0,
                poin_pelanggaran=0
            )
            db.add(dev_user)
            db.commit()
            db.refresh(dev_user)

        print("[7/7] Menghapus akun non-developer...")
        deleted_count = db.query(models.Karyawan).filter(models.Karyawan.username != 'developer').delete()
        print(f"Berhasil menghapus {deleted_count} akun dummy.")

        db.commit()
        print("DATABASE CLEANUP BERHASIL 100%!")

    except Exception as e:
        db.rollback()
        print(f"Error saat cleanup: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    clean_database()
