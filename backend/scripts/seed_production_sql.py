# backend/scripts/seed_production_sql.py
import sys
import os
from pathlib import Path
from datetime import date
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import SessionLocal, engine, Base
import models
from core.security import get_password_hash

# 1. PARTNERS (BUYERS & SUBCON)
PARTNERS_DATA = [
    # Buyers
    {"code": "BYR-ALITIHAD", "name": "AL-ITIHAD", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334401"},
    {"code": "BYR-BINTANG", "name": "BINTANG MADANI", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334402"},
    {"code": "BYR-CAMO", "name": "CAMO WARBROKE", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334403"},
    {"code": "BYR-DELUSI", "name": "DELUSI", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334404"},
    {"code": "BYR-FADFAD", "name": "FADFAD", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334405"},
    {"code": "BYR-GOTOFAD", "name": "GOTO FADFAD", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334406"},
    {"code": "BYR-INSIGHT", "name": "INSIGHT ( SMBU )", "category": "BUYER", "address": "Jakarta Barat", "phone": "08122334407"},
    {"code": "BYR-NEVERSUR", "name": "NEVER SURENDER", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334408"},
    {"code": "BYR-OXFOORD", "name": "OXFOORD", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334409"},
    {"code": "BYR-PAKDENNY", "name": "PAKDENNY", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334410"},
    {"code": "BYR-PAMOKIDS", "name": "PAMOKIDS", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334411"},
    {"code": "BYR-PLANET", "name": "PLANETSUR ( SMBU )", "category": "BUYER", "address": "Jakarta Barat", "phone": "08122334412"},
    {"code": "BYR-SEVENTY", "name": "SEVENTYFOUR", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334413"},
    {"code": "BYR-SERAGAM", "name": "SERAGAM", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334414"},
    {"code": "BYR-SERPARANG", "name": "SERPARANG", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334415"},
    {"code": "BYR-SGI", "name": "SGI", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334416"},
    {"code": "BYR-SPYDER", "name": "SPYDERBILT ( SMBU )", "category": "BUYER", "address": "Jakarta Barat", "phone": "08122334417"},
    {"code": "BYR-SMBU", "name": "SMBU", "category": "BUYER", "address": "Jakarta Barat", "phone": "08122334418"},
    {"code": "BYR-TRAVEOLOGY", "name": "TRAVEOLOGY", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334419"},
    {"code": "BYR-VOXFLY", "name": "VOXFLY ( SMBU )", "category": "BUYER", "address": "Jakarta Barat", "phone": "08122334420"},
    {"code": "BYR-WARNING", "name": "WARNING", "category": "BUYER", "address": "Bandung, Jawa Barat", "phone": "08122334421"},
    {"code": "BYR-WILMER", "name": "WILMER STUDIOS", "category": "BUYER", "address": "Jakarta Barat", "phone": "08122334422"},

    # Maklun Sewing
    {"code": "MKL-ALITIHAD", "name": "AL-ITIHAD GARMENT", "category": "MAKLUN_SEWING", "address": "Cimahi, Jawa Barat", "phone": "08133445501"},
    {"code": "MKL-PAKADESMD", "name": "PAK ADE SMD", "category": "MAKLUN_SEWING", "address": "Sumedang, Jawa Barat", "phone": "08133445502"},
    {"code": "MKL-PAKADECPR", "name": "PAK ADE CIPARAY", "category": "MAKLUN_SEWING", "address": "Ciparay, Jawa Barat", "phone": "08133445503"},
    {"code": "MKL-ADADANG", "name": "A DADANG", "category": "MAKLUN_SEWING", "address": "Majalaya, Jawa Barat", "phone": "08133445504"},
    {"code": "MKL-PAKAEP", "name": "PAK AEP TASIK", "category": "MAKLUN_SEWING", "address": "Tasikmalaya, Jawa Barat", "phone": "08133445505"},
    {"code": "MKL-PANANA", "name": "MASTER PA NANA", "category": "MAKLUN_SEWING", "address": "Bandung, Jawa Barat", "phone": "08133445506"},
    {"code": "MKL-PAKENGKUS", "name": "PAK ENGKUS", "category": "MAKLUN_SEWING", "address": "Bandung, Jawa Barat", "phone": "08133445507"},
    {"code": "MKL-PAPIAN", "name": "MASTER PA PIAN", "category": "MAKLUN_SEWING", "address": "Bandung, Jawa Barat", "phone": "08133445508"},
    {"code": "MKL-MGMT", "name": "MANAGEMENT", "category": "MAKLUN_SEWING", "address": "Internal Pabrik CJM", "phone": "08133445509"},

    # Subcon Washing, Print, Embroidery
    {"code": "WSH-ANUGRAH", "name": "ANUGRAH WASHING", "category": "SUBCON_WASHING", "address": "Kopo, Bandung", "phone": "08155667701"},
    {"code": "WSH-BLESSINDO", "name": "BLESSINDO WASHING", "category": "SUBCON_WASHING", "address": "Cimahi, Jawa Barat", "phone": "08155667702"},
    {"code": "WSH-ELPITO", "name": "ELPITO WASHING", "category": "SUBCON_WASHING", "address": "Bandung, Jawa Barat", "phone": "08155667703"},
    {"code": "WSH-MASTER", "name": "MASTER LAUNDRY", "category": "SUBCON_WASHING", "address": "Cimahi, Jawa Barat", "phone": "08155667704"},
    {"code": "WSH-RITECLEAN", "name": "RITE CLEAN WASHING", "category": "SUBCON_WASHING", "address": "Majalaya, Bandung", "phone": "08155667705"},
    {"code": "PRT-CIPTAJAYA", "name": "CIPTA JAYA PRINT", "category": "SUBCON_PRINT", "address": "Moh Toha, Bandung", "phone": "08177889901"},
    {"code": "PRT-MASKIRNO", "name": "MAS KIRNO PRINT", "category": "SUBCON_PRINT", "address": "Majalaya, Bandung", "phone": "08177889902"},
    {"code": "PRT-PAGANDA", "name": "PA GANDA PRINT", "category": "SUBCON_PRINT", "address": "Ciparay, Bandung", "phone": "08177889903"},
    {"code": "EMB-CJM", "name": "CJM EMBROIDERY", "category": "SUBCON_EMBROIDERY", "address": "Internal Pabrik CJM", "phone": "08188990001"},
    {"code": "EMB-KODEDE", "name": "KO DEDE EMBRO", "category": "SUBCON_EMBROIDERY", "address": "Kopo, Bandung", "phone": "08188990002"}
]

# 2. EMPLOYEES (KARYAWAN)
EMPLOYEES_DATA = [
    {"id_karyawan": "KRY-PPIC-01", "nama": "Khaerulsandi", "username": "khaerulsandi.ppic", "role": "PPIC", "jabatan": "Kepala PPIC & Planning", "tipe_pay": "BULANAN", "gaji_pokok": 5000000},
    {"id_karyawan": "KRY-QC-01", "nama": "Fitrah", "username": "fitrah.qc", "role": "QC_INSPECTOR", "jabatan": "Quality Control Fabric Inspector", "tipe_pay": "BULANAN", "gaji_pokok": 4500000},
    {"id_karyawan": "KRY-CUT-01", "nama": "Bu Nani", "username": "nani.cutting", "role": "CUTTING_OPERATOR", "jabatan": "Kepala Meja Potong", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 800},
    {"id_karyawan": "KRY-PRS-01", "nama": "Silma", "username": "silma.press", "role": "PRESS_OPERATOR", "jabatan": "Operator Press & Numbering", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 400},
    {"id_karyawan": "KRY-PRS-02", "nama": "Anzani", "username": "anzani.press", "role": "PRESS_OPERATOR", "jabatan": "Operator Press Kain Keras", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 400},
    {"id_karyawan": "KRY-PRS-03", "nama": "Nazma", "username": "nazma.press", "role": "PRESS_OPERATOR", "jabatan": "Operator Numbering Pola", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 400},
    {"id_karyawan": "KRY-PRS-04", "nama": "Teni", "username": "teni.press", "role": "PRESS_OPERATOR", "jabatan": "Operator Persiapan Pola", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 400},
    {"id_karyawan": "KRY-SEW-01", "nama": "Anis", "username": "anis.sewing", "role": "LINE_SUPERVISOR", "jabatan": "Supervisor Lini Jahit Internal", "tipe_pay": "BULANAN", "gaji_pokok": 4500000},
    {"id_karyawan": "KRY-SEW-02", "nama": "Pa Ato", "username": "paato.sewing", "role": "LINE_SUPERVISOR", "jabatan": "Supervisor Maklun Jahit Luar", "tipe_pay": "BULANAN", "gaji_pokok": 4500000},
    {"id_karyawan": "KRY-FIN-01", "nama": "Johan", "username": "johan.fin", "role": "FINISHING_OPERATOR", "jabatan": "Operator Steam Uap", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 500},
    {"id_karyawan": "KRY-FIN-02", "nama": "Ica", "username": "ica.fin", "role": "FINISHING_OPERATOR", "jabatan": "Operator Pasang Kancing & QC", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 400},
    {"id_karyawan": "KRY-FIN-03", "nama": "Erika", "username": "erika.fin", "role": "FINISHING_OPERATOR", "jabatan": "Operator Buang Benang", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 300},
    {"id_karyawan": "KRY-FIN-04", "nama": "Desti", "username": "desti.fin", "role": "FINISHING_OPERATOR", "jabatan": "Operator Lipat & Packing", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 400},
    {"id_karyawan": "KRY-FIN-05", "nama": "Dedi", "username": "dedi.fin", "role": "FINISHING_OPERATOR", "jabatan": "Operator Finishing Khusus", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 500},
    {"id_karyawan": "KRY-FIN-06", "nama": "Yusuf", "username": "yusuf.fin", "role": "FINISHING_OPERATOR", "jabatan": "Operator Finishing", "tipe_pay": "BORONGAN", "tarif_borongan_pcs": 500},
    {"id_karyawan": "KRY-EXP-01", "nama": "Sandi", "username": "sandi.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Koordinator Pengiriman & Ekspedisi", "tipe_pay": "BULANAN", "gaji_pokok": 4000000},
    {"id_karyawan": "KRY-EXP-02", "nama": "Pa Kadar", "username": "kadar.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Distribusi Logistik", "tipe_pay": "BULANAN", "gaji_pokok": 3800000},
    {"id_karyawan": "KRY-EXP-03", "nama": "Pedro", "username": "pedro.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Kirim Subcon Washing", "tipe_pay": "BULANAN", "gaji_pokok": 3800000},
    {"id_karyawan": "KRY-EXP-04", "nama": "Pa Ujang", "username": "ujang.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Pengiriman SJP", "tipe_pay": "BULANAN", "gaji_pokok": 3800000},
    {"id_karyawan": "KRY-EXP-05", "nama": "Bian", "username": "bian.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Logistik Bahan", "tipe_pay": "BULANAN", "gaji_pokok": 3800000},
    {"id_karyawan": "KRY-EXP-06", "nama": "Ronny", "username": "ronny.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Distribusi Kain", "tipe_pay": "BULANAN", "gaji_pokok": 3800000},
    {"id_karyawan": "KRY-EXP-07", "nama": "Arendi", "username": "arendi.driver", "role": "EXPEDITION_DRIVER", "jabatan": "Driver Ekspedisi Buyer", "tipe_pay": "BULANAN", "gaji_pokok": 3800000}
]

# 3. INVENTORY ITEMS (FABRIC & PURING)
INVENTORY_ITEMS_DATA = [
    {"item_code": "MG-2604-BH0001", "description": "PURING PUTIH 01 WARNING", "item_type": "PURING", "unit": "YARD", "unit_price": 14000.0, "current_stock": 500.0},
    {"item_code": "MG-2604-BH0002", "description": "PETRINA WHITE", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 31000.0, "current_stock": 800.0},
    {"item_code": "MG-2604-BH0003", "description": "PETRINA BLACK", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 31000.0, "current_stock": 750.0},
    {"item_code": "MG-2604-BH0004", "description": "RISTER", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 53000.0, "current_stock": 400.0},
    {"item_code": "MG-2604-BH0005", "description": "DEALOVA SALUR KECIL", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 28000.0, "current_stock": 350.0},
    {"item_code": "MG-2604-BH0006", "description": "DEALOVA SALUR SEDANG", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 28000.0, "current_stock": 300.0},
    {"item_code": "MG-2604-BH0007", "description": "SALUR CATEXTILE MEDIUM BLUE", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 32000.0, "current_stock": 450.0},
    {"item_code": "MG-2604-BH0008", "description": "MASTER STRETCH", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 34000.0, "current_stock": 600.0},
    {"item_code": "MG-2604-BH0009", "description": "PID CYGNUS", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 36000.0, "current_stock": 250.0},
    {"item_code": "MG-2604-BH0010", "description": "SALUR CANDY BLUE", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 29000.0, "current_stock": 300.0},
    {"item_code": "MG-2604-BH0011", "description": "SALUR CANDY RED", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 29000.0, "current_stock": 300.0},
    {"item_code": "MG-2604-BH0012", "description": "PURING POLI KOTAK", "item_type": "PURING", "unit": "YARD", "unit_price": 12500.0, "current_stock": 400.0},
    {"item_code": "MG-2604-BH0013", "description": "CANVAS SUEDING KHAKY", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 39000.0, "current_stock": 500.0},
    {"item_code": "MG-2604-BH0014", "description": "CANVAS SUEDING DARK GREY", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 39000.0, "current_stock": 500.0},
    {"item_code": "MG-2604-BH0015", "description": "POPLIN STRETCH BLACK", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 25000.0, "current_stock": 650.0},
    {"item_code": "MG-2604-BH0016", "description": "POPLIN STRETCH WHITE", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 25000.0, "current_stock": 650.0},
    {"item_code": "MG-2604-BH0017", "description": "LINEN CRINKLE BLACK", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 35000.0, "current_stock": 400.0},
    {"item_code": "MG-2604-BH0018", "description": "LINEN CRINKLE KHAKY", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 35000.0, "current_stock": 400.0},
    {"item_code": "MG-2604-BH0019", "description": "TWILL STRETCH BLACK", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 33000.0, "current_stock": 800.0},
    {"item_code": "MG-2604-BH0020", "description": "TWILL STRETCH BLUE", "item_type": "FABRIC_MAIN", "unit": "YARD", "unit_price": 33000.0, "current_stock": 800.0}
]

# 4. SALES ORDERS
SALES_ORDERS_DATA = [
    {"so_number": "SO-MG260001", "buyer_name": "WILMER STUDIOS", "style_name": "KEMEJA PIQUE SAKU HITAM", "item_category": "GARMENT", "color": "BLACK", "order_qty": 500, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 35000.0, "total_order_value": 17500000.0},
    {"so_number": "SO-MG260002", "buyer_name": "WILMER STUDIOS", "style_name": "KEMEJA PIQUE SAKU PUTIH", "item_category": "GARMENT", "color": "WHITE", "order_qty": 400, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 35000.0, "total_order_value": 14000000.0},
    {"so_number": "SO-MG260003", "buyer_name": "INSIGHT ( SMBU )", "style_name": "FLANELLA LONG SHIRT", "item_category": "GARMENT", "color": "PLAID", "order_qty": 600, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 38000.0, "total_order_value": 22800000.0},
    {"so_number": "SO-MG260004", "buyer_name": "VOXFLY ( SMBU )", "style_name": "WIND MILD BLACK", "item_category": "LONG JEANS", "color": "BLACK", "order_qty": 1060, "status": "SHIPPED", "order_date": date(2026, 4, 1), "unit_price": 35000.0, "total_order_value": 37100000.0},
    {"so_number": "SO-MG260005", "buyer_name": "VOXFLY ( SMBU )", "style_name": "WIND MILD BLUE", "item_category": "LONG JEANS", "color": "NAVY", "order_qty": 1494, "status": "CUTTING", "order_date": date(2026, 4, 1), "unit_price": 35000.0, "total_order_value": 52290000.0},
    {"so_number": "SO-MG260006", "buyer_name": "VOXFLY ( SMBU )", "style_name": "WIND MILD BLUE", "item_category": "GARMENT", "color": "BLUE", "order_qty": 300, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 35000.0, "total_order_value": 10500000.0},
    {"so_number": "SO-MG260007", "buyer_name": "WARNING", "style_name": "DECOTTON 2.433", "item_category": "GARMENT", "color": "BLACK", "order_qty": 250, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 32000.0, "total_order_value": 8000000.0},
    {"so_number": "SO-MG260008", "buyer_name": "WARNING", "style_name": "DECOTTON 2.434", "item_category": "GARMENT", "color": "WHITE", "order_qty": 250, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 32000.0, "total_order_value": 8000000.0},
    {"so_number": "SO-MG260009", "buyer_name": "WARNING", "style_name": "DECOTTON 2.435", "item_category": "GARMENT", "color": "GREY", "order_qty": 250, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 32000.0, "total_order_value": 8000000.0},
    {"so_number": "SO-MG260010", "buyer_name": "VOXFLY ( SMBU )", "style_name": "SKULLY SHIRT BENDERA PUTIH", "item_category": "GARMENT", "color": "WHITE", "order_qty": 300, "status": "REGISTERED", "order_date": date(2026, 4, 1), "unit_price": 30000.0, "total_order_value": 9000000.0},
    {"so_number": "SO-MG260025", "buyer_name": "VOXFLY ( SMBU )", "style_name": "SAMURAI", "item_category": "SS KEMEJA", "color": "BIRU", "order_qty": 1163, "status": "SHIPPED", "order_date": date(2026, 4, 13), "unit_price": 32000.0, "total_order_value": 37216000.0},
    {"so_number": "SO-MG260028", "buyer_name": "NEVER SURENDER", "style_name": "DENIM BLUE WHISKER", "item_category": "LONG JEANS", "color": "BLUE", "order_qty": 200, "status": "SHIPPED", "order_date": date(2026, 4, 21), "unit_price": 38000.0, "total_order_value": 7600000.0},
    {"so_number": "SO-MG260029", "buyer_name": "NEVER SURENDER", "style_name": "DENIM BLACK WHISKER", "item_category": "LONG JEANS", "color": "BLACK", "order_qty": 200, "status": "SHIPPED", "order_date": date(2026, 4, 21), "unit_price": 38000.0, "total_order_value": 7600000.0},
    {"so_number": "SO-MG260048", "buyer_name": "TRAVEOLOGY", "style_name": "JEANS JACKET INDIGO BLUE", "item_category": "LONG JAKET", "color": "INDIGO", "order_qty": 189, "status": "SHIPPED", "order_date": date(2026, 4, 28), "unit_price": 45000.0, "total_order_value": 8505000.0},
    {"so_number": "SO-MG260049", "buyer_name": "TRAVEOLOGY", "style_name": "JEANS JACKET LIGHT BLUE", "item_category": "LONG JAKET", "color": "LIGHT BLUE", "order_qty": 189, "status": "SHIPPED", "order_date": date(2026, 4, 28), "unit_price": 45000.0, "total_order_value": 8505000.0},
    {"so_number": "SO-MG260062", "buyer_name": "OXFOORD", "style_name": "NEW OUTER BUTTON BEIGE", "item_category": "OUTER BUTTON", "color": "BEIGE", "order_qty": 166, "status": "SHIPPED", "order_date": date(2026, 5, 11), "unit_price": 36000.0, "total_order_value": 5976000.0},
    {"so_number": "SO-MG260063", "buyer_name": "OXFOORD", "style_name": "NEW OUTER BUTTON DARK GREY", "item_category": "OUTER BUTTON", "color": "DARK GREY", "order_qty": 167, "status": "SHIPPED", "order_date": date(2026, 5, 11), "unit_price": 36000.0, "total_order_value": 6012000.0},
    {"so_number": "SO-MG260064", "buyer_name": "OXFOORD", "style_name": "NEW OUTER BUTTON BLACK", "item_category": "OUTER BUTTON", "color": "BLACK", "order_qty": 164, "status": "SHIPPED", "order_date": date(2026, 5, 11), "unit_price": 36000.0, "total_order_value": 5904000.0},
    {"so_number": "SO-MG260076", "buyer_name": "WARNING", "style_name": "ARVYN LN#1 18", "item_category": "SS KEMEJA", "color": "BLACK", "order_qty": 120, "status": "SHIPPED", "order_date": date(2026, 5, 20), "unit_price": 33000.0, "total_order_value": 3960000.0},
    {"so_number": "SO-MG260078", "buyer_name": "WARNING", "style_name": "SKIVE LN#5 REG-FIT", "item_category": "SS KEMEJA", "color": "BROWN", "order_qty": 78, "status": "FINISHING", "order_date": date(2026, 5, 20), "unit_price": 33000.0, "total_order_value": 2574000.0}
]

def seed_production_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("🚀 Memulai seeding data produksi PT. Chikal Jaya Makmur...\n")

        # 1. Seed Partners
        print(f"[1/4] Seeding {len(PARTNERS_DATA)} Rekanan (Buyers & Subcon)...")
        partner_map = {}
        for p in PARTNERS_DATA:
            existing = db.query(models.Partner).filter(models.Partner.name == p["name"]).first()
            if not existing:
                existing = models.Partner(
                    code=p.get("code"),
                    name=p["name"],
                    category=p["category"],
                    address=p["address"],
                    phone=p["phone"]
                )
                db.add(existing)
                db.flush()
            partner_map[p["name"]] = existing.id

        # 2. Seed Karyawan
        print(f"[2/4] Seeding {len(EMPLOYEES_DATA)} Karyawan Operasional...")
        default_pwd_hash = get_password_hash("MasterGarment2026!")
        for e in EMPLOYEES_DATA:
            existing = db.query(models.Karyawan).filter(models.Karyawan.username == e["username"]).first()
            if not existing:
                emp = models.Karyawan(
                    id_karyawan=e["id_karyawan"],
                    nama=e["nama"],
                    username=e["username"],
                    hashed_password=default_pwd_hash,
                    role=e["role"],
                    jabatan=e["jabatan"],
                    pin="123456",
                    is_active=True,
                    status_karyawan="TETAP",
                    tipe_pay=e.get("tipe_pay", "BULANAN"),
                    gaji_pokok=e.get("gaji_pokok", 0),
                    tarif_borongan_pcs=e.get("tarif_borongan_pcs", 0),
                    total_hadir=26
                )
                db.add(emp)

        # 3. Seed Inventory Items
        print(f"[3/4] Seeding {len(INVENTORY_ITEMS_DATA)} Item Kain & Puring...")
        for inv in INVENTORY_ITEMS_DATA:
            existing = db.query(models.InventoryItem).filter(models.InventoryItem.item_code == inv["item_code"]).first()
            if not existing:
                item = models.InventoryItem(
                    item_code=inv["item_code"],
                    description=inv["description"],
                    item_type=inv["item_type"],
                    unit=inv["unit"],
                    unit_price=inv["unit_price"],
                    current_stock=inv["current_stock"]
                )
                db.add(item)
            else:
                existing.description = inv["description"]
                existing.unit_price = inv["unit_price"]

        # 4. Seed Sales Orders
        print(f"[4/4] Seeding {len(SALES_ORDERS_DATA)} Sales Orders...")
        for so in SALES_ORDERS_DATA:
            existing = db.query(models.SalesOrder).filter(models.SalesOrder.so_number == so["so_number"]).first()
            buyer_id = partner_map.get(so["buyer_name"])
            if not existing:
                so_obj = models.SalesOrder(
                    so_number=so["so_number"],
                    buyer_id=buyer_id,
                    style_name=so["style_name"],
                    item_category=so["item_category"],
                    color=so["color"],
                    order_qty=so["order_qty"],
                    status=so["status"],
                    order_date=so["order_date"],
                    contract_type="CMT",
                    unit_price=so["unit_price"],
                    total_order_value=so["total_order_value"],
                    size_breakdown_target={"28": int(so["order_qty"] * 0.2), "30": int(so["order_qty"] * 0.3), "32": int(so["order_qty"] * 0.3), "34": int(so["order_qty"] * 0.2)} if so["order_qty"] > 0 else {}
                )
                db.add(so_obj)

        db.commit()
        print("\n✅ SEEDING DATA PRODUKSI PT. CHIKAL JAYA MAKMUR SUKSES!")

    except Exception as err:
        db.rollback()
        print(f"\n❌ Gagal seeding: {err}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_production_database()
