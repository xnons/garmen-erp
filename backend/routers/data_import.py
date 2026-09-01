"""
Impor data Excel dari dalam aplikasi (Owner/Admin/Developer).

Menggunakan ulang parser di scripts/import_excel_blueprint.py.
- POST /api/import/blueprint/preview : unggah 1-2 file .xlsx -> ringkasan + contoh + peringatan
- POST /api/import/blueprint/commit  : unggah KEDUA file -> jalankan UPSERT ke DB, kembalikan delta
"""
from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy import text

from database import engine
import models
from core.security import require_role
from scripts.import_excel_blueprint import parse_bahan, parse_monitoring, write_sql

router = APIRouter(prefix="/api/import", tags=["Data Import"])

_ALLOW = require_role(["OWNER", "ADMIN", "DEVELOPER"])

BAHAN_SHEETS = {"Stok Bahan", "Barang Masuk", "Barang Keluar", "Code So"}
MONITORING_SHEETS = {"Monitoring", "GUDANG BAHAN", "FORM RIJEK BORDIR", "DATA"}

_TABLES = ["partners", "inventory_items", "sales_orders", "material_receipts",
           "material_allocations", "wip_movements", "cutting_records", "reject_logs"]


def _rm(p: Path) -> None:
    """Hapus file sementara — best effort (Windows kadang masih mengunci)."""
    try:
        p.unlink(missing_ok=True)
    except OSError:
        pass


def _save_tmp(upload: UploadFile) -> Path:
    if not upload.filename or not upload.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(400, f"File '{upload.filename}' bukan Excel (.xlsx).")
    data = upload.file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(400, "File melebihi 25 MB.")
    tmp = Path(tempfile.gettempdir()) / f"imp_{uuid.uuid4().hex}.xlsx"
    tmp.write_bytes(data)
    return tmp


def _detect_kind(path: Path) -> str:
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True)
    sheets = set(wb.sheetnames)
    wb.close()
    if sheets & MONITORING_SHEETS and "Monitoring" in sheets:
        return "monitoring"
    if sheets & BAHAN_SHEETS and "Stok Bahan" in sheets:
        return "bahan"
    raise HTTPException(400, f"Struktur sheet tidak dikenali: {sorted(sheets)[:8]}")


@router.post("/blueprint/preview")
def preview(
    bahan: UploadFile | None = File(None),
    monitoring: UploadFile | None = File(None),
    _user: models.Karyawan = Depends(_ALLOW),
):
    if not bahan and not monitoring:
        raise HTTPException(400, "Unggah minimal satu file Excel.")

    rep: list = []
    out: dict = {"warnings": [], "summary": {}, "samples": {}}

    def sample(rows, n=5):
        return [{k: v for k, v in r.items() if not str(k).startswith("_")} for r in rows[:n]]

    if bahan:
        p = _save_tmp(bahan)
        try:
            if _detect_kind(p) != "bahan":
                raise HTTPException(400, f"'{bahan.filename}' bukan file DATA BAHAN.")
            items, receipts, allocs, codeso = parse_bahan(p, rep)
            out["summary"].update(
                inventory_items=len(items), material_receipts=len(receipts),
                material_allocations=len(allocs), sales_orders_from_codeso=len(codeso),
            )
            out["samples"].update(
                inventory_items=sample(items), material_receipts=sample(receipts),
            )
        finally:
            _rm(p)

    if monitoring:
        p = _save_tmp(monitoring)
        try:
            if _detect_kind(p) != "monitoring":
                raise HTTPException(400, f"'{monitoring.filename}' bukan file MONITORING.")
            sos, wips, cuts, rejs, partners = parse_monitoring(p, rep)
            out["summary"].update(
                sales_orders=len(sos), wip_movements=len(wips),
                cutting_records=len(cuts), reject_logs=len(rejs), partners=len(partners),
            )
            out["samples"].update(
                sales_orders=sample(sos), wip_movements=sample(wips),
                reject_logs=sample(rejs),
            )
        finally:
            _rm(p)

    out["warnings"] = [line for line in rep if line.strip().startswith(("- ", "###"))]
    return out


@router.post("/blueprint/commit")
def commit(
    bahan: UploadFile = File(...),
    monitoring: UploadFile = File(...),
    _user: models.Karyawan = Depends(_ALLOW),
):
    pb = _save_tmp(bahan)
    pm = _save_tmp(monitoring)
    sql_path = Path(tempfile.gettempdir()) / f"imp_{uuid.uuid4().hex}.sql"
    try:
        if _detect_kind(pb) != "bahan":
            raise HTTPException(400, f"'{bahan.filename}' bukan file DATA BAHAN.")
        if _detect_kind(pm) != "monitoring":
            raise HTTPException(400, f"'{monitoring.filename}' bukan file MONITORING.")

        rep: list = []
        items, receipts, allocs, codeso = parse_bahan(pb, rep)
        sos, wips, cuts, rejs, partners = parse_monitoring(pm, rep)
        data = dict(items=items, receipts=receipts, allocs=allocs, codeso=codeso,
                    sos=sos, wips=wips, cuts=cuts, rejs=rejs, partners=partners)
        write_sql(sql_path, data)

        sql = sql_path.read_text(encoding="utf-8")
        sql = sql.replace("BEGIN;\n", "", 1).rsplit("COMMIT;", 1)[0]

        with engine.connect() as conn:
            before = {t: conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar() for t in _TABLES}

        # Eksekusi lewat DBAPI cursor mentah — hindari interpolasi `%` psycopg2
        # pada literal SQL seperti  LIKE 'IMP-2026-%'.
        raw = engine.raw_connection()
        try:
            cur = raw.cursor()
            cur.execute(sql)
            cur.close()
            raw.commit()
        except Exception:
            raw.rollback()
            raise
        finally:
            raw.close()

        with engine.connect() as conn:
            after = {t: conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar() for t in _TABLES}

        deltas = {t: {"before": before[t], "after": after[t], "delta": after[t] - before[t]}
                  for t in _TABLES}
        return {
            "ok": True,
            "parsed": {k: len(v) for k, v in data.items()},
            "deltas": deltas,
            "warnings": [line for line in rep if line.strip().startswith("- ")],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Gagal impor: {e}")
    finally:
        for f in (pb, pm, sql_path):
            _rm(f)
