# force_seed.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
import models
from core.security import get_password_hash

print("⏳ Sedang membuat seluruh tabel di Supabase Cloud...")
# Membuat semua tabel (karyawan, system_security, dll)
models.Base.metadata.create_all(bind=engine)
print("✅ Semua tabel berhasil dibuat di Supabase!")

db = SessionLocal()
try:
    # 1. Seed Master PIN (Default: 1234)
    sec = db.query(models.SystemSecurity).filter(models.SystemSecurity.id == 1).first()
    if not sec:
        master_pin = models.SystemSecurity(
            id=1,
            master_pin_hash=get_password_hash("1234"),
            updated_by="SYSTEM"
        )
        db.add(master_pin)
        db.commit()
        print("🔒 Master PIN '1234' berhasil masuk ke Supabase!")
    else:
        print("ℹ️ Master PIN sudah ada di Supabase.")

    # 2. Seed Akun Owner
    owner = db.query(models.Karyawan).filter(models.Karyawan.username == "admin.nexora").first()
    if not owner:
        user_master = models.Karyawan(
            id_karyawan="KRY-2026-001",
            nama="Bapak Owner Nexora",
            username="admin.nexora",
            hashed_password=get_password_hash("masterpassword123"),
            role="OWNER",
            jabatan="General Manager / Owner",
            tanggal_lahir="1991-01-01",
            no_hp="081234567890",
            alamat="Head Office Nexora Garment",
            status_karyawan="TETAP",
            tanggal_masuk="2026-01-01",
            is_active=True,
            tipe_pay="BULANAN",
            gaji_pokok=10000000,
            tarif_borongan_pcs=0,
            total_hadir=25, 
            total_terlambat=0, 
            total_izin=0, 
            total_alpa=0, 
            poin_pelanggaran=0
        )
        db.add(user_master)
        db.commit()
        print("🟢 Akun Owner 'admin.nexora' berhasil dibuat di Supabase!")
    else:
        print("ℹ️ Akun Owner sudah ada.")

except Exception as e:
    print(f"⚠️ Error Seed: {e}")
finally:
    db.close()