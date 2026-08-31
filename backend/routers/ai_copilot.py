# backend/routers/ai_copilot.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from database import get_db
import models
from core.security import get_current_user, require_role
from core.openrouter_client import (
    chat_with_persona, parse_raw_text_to_form, analyze_fabric_defect_vision
)
from core.audit_helper import record_audit

router = APIRouter(prefix="/api/ai", tags=["Enterprise AI Co-Pilot & Vision"])

class AIChatRequest(BaseModel):
    prompt: str
    persona: Optional[str] = "EXECUTIVE" # EXECUTIVE, FINANCE, PRODUCTION, SECURITY
    history: Optional[List[Dict[str, str]]] = []

class AIAutoFillRequest(BaseModel):
    raw_text: str
    form_type: str = "SALES_ORDER" # SALES_ORDER / CUTTING

class AIVisionQCRequest(BaseModel):
    image_base64: str
    defect_notes: Optional[str] = ""

class AIForensicSnapshotRequest(BaseModel):
    action_name: str
    payload_summary: str
    screen_name: Optional[str] = "DASHBOARD"


@router.get("/test")
def ai_test_endpoint(db: Session = Depends(get_db)):
    import traceback
    try:
        reply = chat_with_persona("Test prompt", "EXECUTIVE", db)
        return {"status": "OK", "reply": reply[:200]}
    except Exception as e:
        return {"status": "ERROR", "error": str(e), "traceback": traceback.format_exc()}

@router.post("/chat")
def ai_chat_endpoint(
    payload: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Endpoint Chat Cerdas Multi-Persona dengan injeksi data live transaksi pabrik (Anti-Halusinasi).
    """
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt tidak boleh kosong.")

    try:
        reply = chat_with_persona(
            prompt=payload.prompt,
            persona=payload.persona or "EXECUTIVE",
            db=db,
            history=payload.history
        )
    except Exception as e:
        reply = f"### 📊 Ringkasan Eksekutif Operasional Pabrik\n\nSelamat datang! Sistem Enterprise AI Co-Pilot siap membantu analisis pabrik. (Info: {str(e)})"

    try:
        record_audit(
            db=db,
            actor_id=current_user.id_karyawan,
            aksi="AI_COPILOT_QUERY",
            target_id="OPENROUTER",
            catatan=f"Konsultasi AI Persona '{payload.persona}' oleh {current_user.nama}."
        )
    except Exception as e:
        print(f"[AI Audit Warning]: Gagal mencatat audit: {e}")

    return {
        "persona": payload.persona or "EXECUTIVE",
        "reply": reply,
        "user": current_user.nama
    }


@router.post("/auto-fill")
def ai_auto_fill_endpoint(
    payload: AIAutoFillRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Fitur AI Smart Auto-Fill: Mengubah teks PO/WhatsApp mentah menjadi JSON form otomatis.
    """
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="Teks mentah tidak boleh kosong.")

    parsed_data = parse_raw_text_to_form(payload.raw_text, payload.form_type)
    return {
        "form_type": payload.form_type,
        "parsed_data": parsed_data
    }


@router.post("/vision-qc")
def ai_vision_qc_endpoint(
    payload: AIVisionQCRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Fitur AI Vision Defect Scanner: Analisis foto cacat kain untuk penilaian ASTM 4-Point.
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Gambar base64 tidak boleh kosong.")

    analysis_result = analyze_fabric_defect_vision(payload.image_base64, payload.defect_notes or "")
    
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi="AI_VISION_QC_SCAN",
        target_id="FABRIC_QC",
        catatan=f"AI Vision QC scan oleh {current_user.nama}."
    )

    return analysis_result


@router.post("/forensic-snapshot")
def record_forensic_visual_snapshot(
    payload: AIForensicSnapshotRequest,
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user)
):
    """
    Merekam audit snapshot visual saat aksi kritis dieksekusi pengguna.
    """
    record_audit(
        db=db,
        actor_id=current_user.id_karyawan,
        aksi=f"CRITICAL_ACTION_{payload.action_name.upper()}",
        target_id=payload.screen_name or "AUDIT_SENTINEL",
        catatan=f"Forensic Snapshot: {payload.payload_summary}"
    )

    return {
        "status": "SNAPSHOT_RECORDED",
        "actor": current_user.nama,
        "action": payload.action_name
    }
