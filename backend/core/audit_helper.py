# backend/core/audit_helper.py
from datetime import datetime
from sqlalchemy.orm import Session
import models

def record_audit(db: Session, actor_id: str, aksi: str, target_id: str, catatan: str):
    """
    Fungsi helper untuk mencatat jejak audit ke tabel LogAudit.
    Gunakan ini di setiap endpoint sensitif/destruktif.
    """
    new_log = models.LogAudit(
        timestamp=datetime.now(),
        actor_id=actor_id, # ID Karyawan yang melakukan aksi
        aksi=aksi,         # Contoh: "DELETE_SPK", "PAYROLL_PAID"
        target_id=str(target_id), # ID objek yang dimanipulasi
        catatan=catatan
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)