# backend/core/audit_helper.py
from datetime import datetime
from sqlalchemy.orm import Session
import models

def record_audit(db: Session, actor_id: str, aksi: str, target_id: str, catatan: str):
    """
    Fungsi helper untuk mencatat jejak audit ke tabel LogAudit.
    Gunakan ini di setiap endpoint sensitif/destruktif.
    """
    try:
        new_log = models.LogAudit(
            timestamp=datetime.now(),
            actor_id=str(actor_id or "SYSTEM"),
            aksi=str(aksi or "ACTION"),
            target_id=str(target_id or "-"),
            catatan=str(catatan or "")
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        print(f"[Audit Helper Warning]: Gagal mencatat audit trail: {e}")