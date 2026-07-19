# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Membuat file database bernama nexora_erp.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./nexora_erp.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Fungsi helper untuk injeksi database ke endpoint API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()