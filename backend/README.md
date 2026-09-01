# Master Garment ERP — Backend (FastAPI)

## Menjalankan server (dev)

```bash
cd backend
python -m venv venv && venv/Scripts/activate      # sekali saja
pip install -r requirements.txt
cp .env.example .env                               # lalu isi nilainya
uvicorn main:app --reload --port 8000
```

Variabel environment: lihat [`.env.example`](.env.example). Minimal `DATABASE_URL`;
di produksi `SECRET_KEY` (atau `JWT_SECRET_KEY`) **wajib** atau server gagal start.
Untuk lokal set `DEV_MODE=true`.

Skema DB otomatis disinkronkan saat startup lewat `core/schema_sync.py`
(introspeksi model → `ALTER TABLE ADD COLUMN` untuk kolom baru).

## Menjalankan test

```bash
cd backend
pip install -r requirements-dev.txt
pytest                     # semua
pytest tests/test_auth.py  # satu file
pytest -k rbac -q          # filter
```

Test memakai SQLite file sementara (`tests/_test_garmen.db`, di-reset tiap test),
mem-bypass Login Time Guard, dan memakai bcrypt cost rendah agar cepat. Lifespan
(seeder produksi) tidak ikut jalan.

Cakupan: `test_auth` (login, PIN, hierarki role), `test_rbac` (matriks
role × endpoint + regresi endpoint tanpa proteksi), `test_produksi_flow`
(input→hard-cap→QC anti-self-verify→payroll), `test_wip_discrepancy`
(rumus selisih subcon), `test_warehouse_qc` (4-Point ASTM), `test_security_regressions`.
