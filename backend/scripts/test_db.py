import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load file .env
load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"🔗 Target URL: {db_url}")

if not db_url:
    print("❌ ERROR: File .env TIDAK TERBACA! Pastikan nama file adalah '.env' (bukan '.env.txt').")
else:
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            print("\n✅ BERHASIL CONNECT KE SUPABASE!")
            print(f"🐘 Postgres Version: {result.fetchone()[0]}")
    except Exception as e:
        print("\n❌ GAGAL CONNECT:")
        print(e)