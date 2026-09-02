"""Guard: block piece-rate / prep-wage entry for a payroll period that was
already disbursed (mark-paid).

`mark_payroll_paid` writes a LogAudit row with aksi="PAYROLL_PAID" and
target_id="YYYY-MM"; that row is the authoritative "this month is closed"
marker. Once closed, back-dating a new setoran into that month would slip
money past a settlement that already ran, so create/update/delete on those
rows is refused with 409.
"""
from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

import models


def period_is_settled(db: Session, year: int, month: int) -> bool:
    periode = f"{year:04d}-{month:02d}"
    return db.query(models.LogAudit.id).filter(
        models.LogAudit.aksi == "PAYROLL_PAID",
        models.LogAudit.target_id == periode,
    ).first() is not None


def assert_period_open(db: Session, d: Optional[date], field: str = "Tanggal") -> None:
    """Raise 409 if `d` falls in a payroll period that has been marked paid."""
    if d is None:
        return
    if period_is_settled(db, d.year, d.month):
        raise HTTPException(
            status_code=409,
            detail=(
                f"{field} {d:%Y-%m} berada di periode payroll yang sudah "
                f"dicairkan; entri atau koreksi untuk periode itu ditutup."
            ),
        )
