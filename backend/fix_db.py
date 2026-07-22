import sqlite3

# Hubungkan ke nexora_erp.db (Sama dengan SQLALCHEMY_DATABASE_URL di database.py)
conn = sqlite3.connect("nexora_erp.db")
cursor = conn.cursor()

try:
    # 1. Tambah kolom 'pin' ke tabel karyawan
    cursor.execute("ALTER TABLE karyawan ADD COLUMN pin VARCHAR DEFAULT '1234'")
    print("🟢 Kolom 'pin' berhasil ditambahkan ke tabel karyawan!")
except sqlite3.OperationalError as e:
    print(f"ℹ️ Info: {e}")

# 2. Pastikan semua karyawan yang nilainya NULL diisi PIN '1234'
cursor.execute("UPDATE karyawan SET pin = '1234' WHERE pin IS NULL OR pin = ''")
conn.commit()
conn.close()

print("🟢 Semua data karyawan berhasil di-update dengan default PIN '1234'!")