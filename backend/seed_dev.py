# seed_dev.py
import sys
from database import SessionLocal
import models
from core.security import get_password_hash

def seed_test_accounts():
    db = SessionLocal()
    try:
        raw_password = "DevSecret123!"
        hashed_pwd = get_password_hash(raw_password)

        # Daftar akun testing untuk semua role
        test_users = [
            {
                "id_karyawan": "DEV-001",
                "nama": "Developer Utama",
                "username": "developer",
                "role": "DEVELOPER",
                "jabatan": "System Developer",
                "pin": "6767"
            },
            {
                "id_karyawan": "OWN-001",
                "nama": "Bapak Owner",
                "username": "owner",
                "role": "OWNER",
                "jabatan": "Pemilik Garment",
                "pin": "1234"
            },
            {
                "id_karyawan": "ADM-001",
                "nama": "Siti Admin",
                "username": "admin",
                "role": "ADMIN",
                "jabatan": "Administrator System",
                "pin": "1234"
            },
            {
                "id_karyawan": "FIN-001",
                "nama": "Budi Keuangan",
                "username": "finance",
                "role": "FINANCE",
                "jabatan": "Staff Finance",
                "pin": "1234"
            },
            {
                "id_karyawan": "PRD-001",
                "nama": "Agus Produksi",
                "username": "produksi",
                "role": "PRODUKSI",
                "jabatan": "Kepala Produksi",
                "pin": "1234"
            },
        ]

        print("🚀 Memulai seeding akun testing...\n")

        for user_data in test_users:
            existing_user = db.query(models.Karyawan).filter(models.Karyawan.username == user_data["username"]).first()
            
            if existing_user:
                existing_user.hashed_password = hashed_pwd
                existing_user.role = user_data["role"]
                existing_user.is_active = True
                existing_user.pin = user_data["pin"]
                print(f"🔄 Akun [{user_data['role']}] '{user_data['username']}' berhasil di-update!")
            else:
                new_user = models.Karyawan(
                    id_karyawan=user_data["id_karyawan"],
                    nama=user_data["nama"],
                    username=user_data["username"],
                    hashed_password=hashed_pwd,
                    role=user_data["role"],
                    jabatan=user_data["jabatan"],
                    status_karyawan="TETAP",
                    is_active=True,
                    pin=user_data["pin"]
                )
                db.add(new_user)
                print(f"✅ Akun [{user_data['role']}] '{user_data['username']}' berhasil dibuat!")

        db.commit()
        print("\n🎉 SEMUA AKUN TESTING BERHASIL DIBUAT/DI-UPDATE!\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_accounts()