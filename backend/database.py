import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Paksa load .env dari folder tempat database.py berada
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Ambil URL Database dari .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Perbaiki format prefix jika diawali postgres:// (SQLAlchemy butuh postgresql://)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Debugging: Cetak URL database yang sedang aktif di terminal
print("\n" + "="*50)
print(f"📡 DATABASE CONNECTION ACTIVE:")
print(f"👉 {SQLALCHEMY_DATABASE_URL}")
print("="*50 + "\n")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ CRITICAL: DATABASE_URL tidak ditemukan di file .env!")

# 3. Buat Engine PostgreSQL (Tanpa check_same_thread karena bukan SQLite)
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency untuk route FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()