# backend/routers/notifications.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
import models
from core.security import get_current_user
from core.deps import require_roles, get_role
from core.alert_engine import run_scan

router = APIRouter(prefix="/api/notifications", tags=["Notifikasi & Alert"])


def _visible_to(query, role: str):
    """Filter notifikasi yang menyasar role user (atau '*')."""
    if role == "DEVELOPER":
        return query  # developer lihat semua
    return query.filter(or_(
        models.Notification.target_roles == "*",
        models.Notification.target_roles.ilike(f"%{role}%"),
    ))


@router.get("")
@router.get("/")
def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user),
):
    role = get_role(current_user)
    q = _visible_to(db.query(models.Notification), role)
    if unread_only:
        q = q.filter(models.Notification.is_read == False)
    items = q.order_by(models.Notification.created_at.desc()).limit(limit).all()

    unread_count = _visible_to(
        db.query(models.Notification).filter(models.Notification.is_read == False), role
    ).count()

    return {
        "unread_count": unread_count,
        "items": [
            {
                "id": n.id, "type": n.type, "severity": n.severity,
                "title": n.title, "body": n.body,
                "ref_type": n.ref_type, "ref_id": n.ref_id, "menu_hint": n.menu_hint,
                "is_read": n.is_read,
                # created_at disimpan sebagai UTC naif — beri sufiks 'Z' agar klien
                # (browser di WIB) tidak salah tafsir sebagai waktu lokal.
                "created_at": (n.created_at.isoformat() + "Z") if n.created_at else None,
            }
            for n in items
        ],
    }


@router.post("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user),
):
    n = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan.")
    n.is_read = True
    db.commit()
    return {"status": "ok", "id": notif_id}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user),
):
    role = get_role(current_user)
    q = _visible_to(db.query(models.Notification).filter(models.Notification.is_read == False), role)
    count = 0
    for n in q.all():
        n.is_read = True
        count += 1
    db.commit()
    return {"status": "ok", "marked": count}


@router.post("/scan")
def trigger_scan(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["ADMIN", "OWNER", "DEVELOPER"])),
):
    """Pindai kondisi risiko & buat notifikasi baru. Untuk cron eksternal / manual."""
    return run_scan(db)
