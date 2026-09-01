"""
Auto-migrasi ringan berbasis introspeksi.

Menggantikan daftar kolom manual di main.py (auto_migrate_db) yang harus
di-update tangan setiap ada field model baru dan sering ketinggalan.

Cara kerja: bandingkan kolom pada `Base.metadata` (definisi model) dengan
kolom nyata di database, lalu `ALTER TABLE ... ADD COLUMN` untuk yang hilang.
Kolom baru selalu ditambahkan sebagai NULLABLE (dengan DEFAULT bila model
punya default skalar / server_default) — menambah NOT NULL ke tabel berisi
data akan gagal. Constraint NOT NULL milik model tetap berlaku di level ORM
untuk insert baru.

Ini BUKAN pengganti Alembic: tidak menangani perubahan tipe, rename, atau
drop kolom. Untuk itu lihat Lampiran A pada plan (adopsi Alembic).
"""
from __future__ import annotations

from sqlalchemy import inspect as sa_inspect, text
from sqlalchemy.engine import Engine

import models


def _literal_default(column, dialect) -> str | None:
    """Kembalikan potongan `DEFAULT <x>` bila model punya default skalar / server_default, else None."""
    sd = getattr(column, "server_default", None)
    if sd is not None and getattr(sd, "arg", None) is not None:
        try:
            return f"DEFAULT {sd.arg.text}"  # server_default berupa text()
        except AttributeError:
            return f"DEFAULT {sd.arg}"

    d = getattr(column, "default", None)
    if d is not None and getattr(d, "is_scalar", False):
        val = d.arg
        if isinstance(val, bool):
            return f"DEFAULT {'TRUE' if val else 'FALSE'}"
        if isinstance(val, (int, float)):
            return f"DEFAULT {val}"
        if isinstance(val, str):
            escaped = val.replace("'", "''")
            return f"DEFAULT '{escaped}'"
    return None


def sync_schema(engine: Engine) -> list[str]:
    """
    Tambahkan kolom model yang belum ada di database. Idempotent & aman dipanggil
    tiap startup. Mengembalikan daftar kolom yang berhasil ditambahkan (untuk log).
    """
    added: list[str] = []
    try:
        inspector = sa_inspect(engine)
        existing_tables = set(inspector.get_table_names())
        dialect = engine.dialect
        is_sqlite = engine.url.drivername.startswith("sqlite")

        for table in models.Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue  # tabel baru → biar create_all yang buat

            db_cols = {c["name"] for c in inspector.get_columns(table.name)}

            for column in table.columns:
                if column.name in db_cols:
                    continue

                col_type = column.type.compile(dialect=dialect)
                parts = [f'ALTER TABLE {table.name} ADD COLUMN']
                if not is_sqlite:
                    parts.append("IF NOT EXISTS")
                parts.append(f'{column.name} {col_type}')

                default_sql = _literal_default(column, dialect)
                if default_sql:
                    parts.append(default_sql)

                ddl = " ".join(parts)
                try:
                    with engine.begin() as conn:
                        conn.execute(text(ddl))
                    added.append(f"{table.name}.{column.name}")
                except Exception as col_err:
                    print(f"[schema_sync] lewati {table.name}.{column.name}: {col_err}")

        if added:
            print(f"[schema_sync] {len(added)} kolom ditambahkan: {', '.join(added)}")
        else:
            print("[schema_sync] skema database sudah sinkron dengan model.")
    except Exception as e:
        print(f"[schema_sync] WARNING: auto-migrasi gagal: {e}")

    return added
