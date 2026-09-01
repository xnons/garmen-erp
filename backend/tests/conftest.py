"""
Fixtures pytest untuk backend Master Garment ERP.

DB uji: file SQLite terpisah (`tests/_test_garmen.db`), di-drop & re-create tiap
test agar isolasi total. App diimpor sebagai objek biasa (tanpa `with TestClient`)
sehingga lifespan/seeder produksi TIDAK ikut jalan.
"""
import os
import sys
from pathlib import Path

# --- Env HARUS di-set sebelum import modul app (database.py membaca DATABASE_URL saat import) ---
_TESTS_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _TESTS_DIR.parent
os.environ["DATABASE_URL"] = f"sqlite:///{(_TESTS_DIR / '_test_garmen.db').as_posix()}"
os.environ["DEV_MODE"] = "true"
os.environ["SECRET_KEY"] = "pytest-secret-key-not-for-production-0123456789"
os.environ.setdefault("ALLOWED_ORIGINS", "http://testserver")

sys.path.insert(0, str(_BACKEND_DIR))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
import models  # noqa: E402
import main  # noqa: E402
from core.security import get_password_hash  # noqa: E402


# Daftar user standar: (id_karyawan, username, role)
USER_SPECS = [
    ("DEV-001", "developer", "DEVELOPER"),
    ("OWN-001", "owner", "OWNER"),
    ("ADM-001", "admin", "ADMIN"),
    ("FIN-001", "finance", "FINANCE"),
    ("PPC-001", "ppic", "PPIC"),
    ("PRD-001", "produksi", "PRODUKSI"),
    ("PRD-002", "produksi2", "PRODUKSI"),
    ("GDG-001", "gudang", "GUDANG"),
]
PASSWORD = "pass12345"
PIN = "1234"


@pytest.fixture(autouse=True, scope="session")
def _fast_bcrypt():
    """bcrypt cost 4 (bukan 12) selama test — ~256x lebih cepat, tetap valid."""
    import bcrypt
    _orig = bcrypt.gensalt
    bcrypt.gensalt = lambda rounds=4, prefix=b"2b": _orig(4, prefix)
    yield
    bcrypt.gensalt = _orig


@pytest.fixture(autouse=True)
def _fresh_db():
    """Reset skema DB sebelum tiap test."""
    models.Base.metadata.drop_all(bind=database.engine)
    models.Base.metadata.create_all(bind=database.engine)
    yield
    database.engine.dispose()


@pytest.fixture(autouse=True)
def _bypass_working_hours(monkeypatch):
    """Nonaktifkan Login Time Guard agar test tidak bergantung jam dinding.
    Test khusus guard ini me-restore-nya sendiri."""
    monkeypatch.setattr("routers.auth.is_working_hours", lambda: True)


@pytest.fixture
def db():
    s = database.SessionLocal()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture
def client_raw():
    """TestClient yang TIDAK me-raise ulang exception server — untuk menguji
    response 500 dari global exception handler."""
    return TestClient(main.app, raise_server_exceptions=False)


@pytest.fixture
def users(_fresh_db):
    """Buat satu user per role. Password sama untuk semua (PASSWORD)."""
    s = database.SessionLocal()
    try:
        for kid, uname, role in USER_SPECS:
            s.add(models.Karyawan(
                id_karyawan=kid,
                nama=uname.capitalize(),
                username=uname,
                hashed_password=get_password_hash(PASSWORD),
                pin=get_password_hash(PIN),
                role=role,
                is_active=True,
                can_login=True,
                jabatan="Tester",
                status_karyawan="TETAP",
                tipe_pay="BULANAN",
                gaji_pokok=1_000_000,
            ))
        s.commit()
    finally:
        s.close()
    return {role: (kid, uname) for kid, uname, role in USER_SPECS}


@pytest.fixture
def login(client, users):
    def _login(username, password=PASSWORD):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200, f"login {username} gagal: {r.status_code} {r.text}"
        return r.json()["access_token"]
    return _login


@pytest.fixture
def auth(login):
    """auth('developer') -> dict header Authorization Bearer."""
    def _headers(username):
        return {"Authorization": f"Bearer {login(username)}"}
    return _headers


# --------------------------------------------------------------------------
# Factory data langsung ke DB (bypass endpoint) untuk menyiapkan skenario
# --------------------------------------------------------------------------
@pytest.fixture
def make_spk(db):
    from datetime import date

    def _make(spk_id="SPK-TEST-01", target_qty=100, status="ON_PROGRESS", tarif=None):
        import models
        spk = models.SPKProduksi(
            id=spk_id,
            nama_artikel="Kemeja Test",
            target_qty=target_qty,
            status=status,
            tanggal_mulai=date(2026, 1, 1),
            deadline=date(2026, 12, 31),
        )
        db.add(spk)
        for tahapan, rate in (tarif or {"CUTTING": 500.0, "SEWING": 2500.0}).items():
            db.add(models.MasterTarifBorongan(spk_id=spk_id, tahapan_proses=tahapan, tarif_per_pcs=rate))
        db.commit()
        return spk_id
    return _make


@pytest.fixture
def make_so(db):
    from datetime import date

    def _make(so_number="SO-TEST-01", order_qty=500, status="REGISTERED"):
        import models
        so = models.SalesOrder(
            so_number=so_number,
            style_name="WIND TEST",
            item_category="LONG JEANS",
            order_qty=order_qty,
            status=status,
            order_date=date(2026, 1, 1),
            deadline=date(2026, 6, 1),
        )
        db.add(so)
        db.commit()
        db.refresh(so)
        return so.id
    return _make
