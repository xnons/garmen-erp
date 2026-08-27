import sqlite3

conn = sqlite3.connect("nexora_erp.db") # Sesuaikan dengan nama file db Anda
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE log_output_borongan ADD COLUMN nomor_tiket VARCHAR(100);")
    print("🟢 Kolom nomor_tiket berhasil ditambahkan!")
except Exception as e:
    print(e)

try:
    cursor.execute("ALTER TABLE log_output_borongan ADD COLUMN qty_rework INTEGER DEFAULT 0;")
    print("🟢 Kolom qty_rework berhasil ditambahkan!")
except Exception as e:
    print(e)

try:
    cursor.execute("ALTER TABLE log_output_borongan ADD COLUMN qty_scrap INTEGER DEFAULT 0;")
    print("🟢 Kolom qty_scrap berhasil ditambahkan!")
except Exception as e:
    print(e)

conn.commit()
conn.close()
print("🎉 Selesai memodifikasi struktur database!")