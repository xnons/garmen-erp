# backend/scripts/seed_initial_data.py
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal, engine, Base
import models
from core.security import get_password_hash

INITIAL_PARTNERS = [
    # Buyers
    {"code": "BYR-WILMER", "name": "WILMER STUDIOS", "category": "BUYER"},
    {"code": "BYR-VOXFLY", "name": "VOXFLY ( SMBU )", "category": "BUYER"},
    {"code": "BYR-WARNING", "name": "WARNING", "category": "BUYER"},
    {"code": "BYR-FADFAD", "name": "FADFAD", "category": "BUYER"},
    {"code": "BYR-NEVERSUR", "name": "NEVER SURRENDER", "category": "BUYER"},
    {"code": "BYR-SEVENTY4", "name": "SEVENTYFOUR", "category": "BUYER"},
    {"code": "BYR-DELUSI", "name": "DELUSI", "category": "BUYER"},
    {"code": "BYR-OXFOORD", "name": "OXFOORD", "category": "BUYER"},
    {"code": "BYR-TRAVEO", "name": "TRAVEOLOGY", "category": "BUYER"},
    {"code": "BYR-PAMOKIDS", "name": "PAMOKIDS", "category": "BUYER"},
    
    # Maklun Jahit (Sewing)
    {"code": "MKL-ALITIHAD", "name": "AL-ITIHAD GARMENT", "category": "MAKLUN_SEWING"},
    {"code": "MKL-PAKADESMD", "name": "PAK ADE SMD", "category": "MAKLUN_SEWING"},
    {"code": "MKL-PAKADECPR", "name": "PAK ADE CIPARAY", "category": "MAKLUN_SEWING"},
    {"code": "MKL-ADADANG", "name": "A DADANG", "category": "MAKLUN_SEWING"},
    {"code": "MKL-PAKAEP", "name": "PAK AEP TASIK", "category": "MAKLUN_SEWING"},

    # Subcon Washing
    {"code": "WSH-ANUGRAH", "name": "ANUGRAH WASHING", "category": "SUBCON_WASHING"},
    {"code": "WSH-RITECLEAN", "name": "RITE CLEAN WASHING", "category": "SUBCON_WASHING"},
    {"code": "WSH-MASTER", "name": "MASTER LAUNDRY", "category": "SUBCON_WASHING"},
    {"code": "WSH-BLESSINDO", "name": "BLESSINDO WASHING", "category": "SUBCON_WASHING"},
    {"code": "WSH-ELPITO", "name": "ELPITO WASHING", "category": "SUBCON_WASHING"},

    # Subcon Sablon & Print
    {"code": "PRT-MASKIRNO", "name": "MAS KIRNO PRINT", "category": "SUBCON_PRINT"},
    {"code": "PRT-PAGANDA", "name": "PA GANDA PRINT", "category": "SUBCON_PRINT"},
    {"code": "PRT-CIPTAJAYA", "name": "CIPTA JAYA PRINT", "category": "SUBCON_PRINT"},

    # Subcon Embroidery / Bordir
    {"code": "EMB-CJM", "name": "CJM EMBROIDERY", "category": "SUBCON_EMBROIDERY"},
    {"code": "EMB-KODEDE", "name": "KO DEDE EMBRO", "category": "SUBCON_EMBROIDERY"}
]

INITIAL_EMPLOYEES = [
    # PPIC & QC
    {"id_karyawan": "KRY-PPIC-01", "username": "sandi.ppic", "nama": "Khaerulsandi", "role": "PPIC", "jabatan": "Kepala PPIC & Planning"},
    {"id_karyawan": "KRY-QC-01", "username": "fitrah.qc", "nama": "Fitrah", "role": "QC_INSPECTOR", "jabatan": "Quality Control Fabric Inspector"},
    
    # Meja Potong & Persiapan
    {"id_karyawan": "KRY-CUT-01", "username": "nani.cutting", "nama": "Bu Nani", "role": "CUTTING_OPERATOR", "jabatan": "Kepala Meja Potong"},
    {"id_karyawan": "KRY-PRS-01", "username": "silma.press", "nama": "Silma", "role": "PRESS_OPERATOR", "jabatan": "Operator Press & Numbering"},
    {"id_karyawan": "KRY-PRS-02", "username": "anzani.press", "nama": "Anzani", "role": "PRESS_OPERATOR", "jabatan": "Operator Press Kain Keras"},
    {"id_karyawan": "KRY-PRS-03", "username": "nazma.press", "nama": "Nazma", "role": "PRESS_OPERATOR", "jabatan": "Operator Numbering Pola"},

    # Supervisor Lini Jahit Internal
    {"id_karyawan": "KRY-SEW-01", "username": "anis.sewing", "nama": "Anis", "role": "LINE_SUPERVISOR", "jabatan": "Supervisor Lini Jahit Internal"},
    {"id_karyawan": "KRY-SEW-02", "username": "paato.sewing", "nama": "Pa Ato", "role": "LINE_SUPERVISOR", "jabatan": "Supervisor Maklun Jahit Luar"},

    # Finishing & Upah Borongan
    {"id_karyawan": "KRY-FIN-01", "username": "johan.stim", "nama": "Johan", "role": "FINISHING_OPERATOR", "jabatan": "Operator Steam Uap"},
    {"id_karyawan": "KRY-FIN-02", "username": "ica.fin", "nama": "Ica", "role": "FINISHING_OPERATOR", "jabatan": "Operator Pasang Kancing & QC"},
    {"id_karyawan": "KRY-FIN-03", "username": "erika.fin", "nama": "Erika", "role": "FINISHING_OPERATOR", "jabatan": "Operator Buang Benang"},
    {"id_karyawan": "KRY-FIN-04", "username": "desti.fin", "nama": "Desti", "role": "FINISHING_OPERATOR", "jabatan": "Operator Lipat & Packing"},
    {"id_karyawan": "KRY-FIN-05", "username": "dedi.fin", "nama": "Dedi", "role": "FINISHING_OPERATOR", "jabatan": "Operator Finishing"},
    {"id_karyawan": "KRY-FIN-06", "username": "yusuf.fin", "nama": "Yusuf", "role": "FINISHING_OPERATOR", "jabatan": "Operator Finishing"},

    # Ekspedisi & Driver Pengiriman
    {"id_karyawan": "KRY-EXP-01", "username": "sandi.driver", "nama": "Sandi", "role": "EXPEDITION_DRIVER", "jabatan": "Koordinator Pengiriman & Ekspedisi"},
    {"id_karyawan": "KRY-EXP-02", "username": "kadar.driver", "nama": "Pa Kadar", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Distribusi Logistik"},
    {"id_karyawan": "KRY-EXP-03", "username": "pedro.driver", "nama": "Pedro", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Kirim Subcon Washing"},
    {"id_karyawan": "KRY-EXP-04", "username": "ujang.driver", "nama": "Pa Ujang", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Pengiriman SJP"},
    {"id_karyawan": "KRY-EXP-05", "username": "bian.driver", "nama": "Bian", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Logistik Bahan"},
    {"id_karyawan": "KRY-EXP-06", "username": "ronny.driver", "nama": "Ronny", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Distribusi Kain"}
]

def seed_master_data():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[1/2] Menyemai Master Partners (Buyers & Subcon)...")
        for p in INITIAL_PARTNERS:
            existing = db.query(models.Partner).filter(models.Partner.name == p["name"]).first()
            if not existing:
                partner_obj = models.Partner(
                    code=p.get("code"),
                    name=p["name"],
                    category=p["category"],
                    address="Bandung / Jawa Barat",
                    phone="08123456789"
                )
                db.add(partner_obj)

        print("[2/2] Menyemai Master Karyawan Operasional...")
        default_pwd_hash = get_password_hash("MasterGarment2026!")
        for e in INITIAL_EMPLOYEES:
            existing_emp = db.query(models.Karyawan).filter(models.Karyawan.username == e["username"]).first()
            if not existing_emp:
                emp_obj = models.Karyawan(
                    id_karyawan=e["id_karyawan"],
                    nama=e["nama"],
                    username=e["username"],
                    hashed_password=default_pwd_hash,
                    role=e["role"],
                    jabatan=e["jabatan"],
                    pin="123456",
                    is_active=True,
                    status_karyawan="TETAP",
                    tipe_pay="BORONGAN" if "OPERATOR" in e["role"] else "BULANAN",
                    gaji_pokok=4500000 if "BULANAN" in e["role"] else 0,
                    tarif_borongan_pcs=600 if "FINISHING" in e["role"] else 0,
                    total_hadir=26
                )
                db.add(emp_obj)

        db.commit()
        print("SEED MASTER DATA PT. CHIKAL JAYA MAKMUR SUKSES!")

    except Exception as err:
        db.rollback()
        print(f"Gagal seeding master data: {err}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_master_data()
