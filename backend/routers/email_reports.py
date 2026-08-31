# backend/routers/email_reports.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
import models
from core.security import get_current_user, require_role
from core.email_service import send_executive_email_briefing, generate_executive_html_report
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/reports", tags=["Automated Email Reporting"])

class SendReportRequest(BaseModel):
    recipient_email: Optional[str] = "muhammadtegarsaputra@gmail.com"
    recipient_name: Optional[str] = "Muhammad Tegar Saputra"


@router.post("/send-briefing")
def trigger_send_briefing(
    payload: SendReportRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_role(["OWNER", "DEVELOPER", "ADMIN", "FINANCE"]))
):
    """
    Memicu pengiriman laporan executive daily briefing ke email tujuan.
    """
    result = send_executive_email_briefing(
        db=db,
        recipient_email=payload.recipient_email,
        recipient_name=payload.recipient_name or current_user.nama
    )

    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="SEND_EXECUTIVE_EMAIL_REPORT",
        target_id=payload.recipient_email or "DEFAULT_EMAIL",
        catatan=f"Pengiriman laporan eksekutif harian ke {payload.recipient_email} oleh {current_user.nama}."
    )

    return result


@router.get("/preview-briefing-html")
def preview_briefing_html(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Mengembalikan string HTML laporan eksekutif untuk preview di antarmuka web.
    """
    return {
        "html": generate_executive_html_report(db, current_user.nama)
    }
