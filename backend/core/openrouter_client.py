# backend/core/openrouter_client.py
import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import models

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_SITE_NAME = os.getenv("OPENROUTER_SITE_NAME", "Master Garment ERP")

# 🏢 4 PERSONA SYSTEM PROMPTS (ANTI-HALUSINASI & STRICT ERP CONTEXT)
PERSONA_PROMPTS = {
    "EXECUTIVE": """Anda adalah AI Executive Advisor untuk Owner PT. Chikal Jaya Makmur (Master Garment).
Fokus Anda adalah:
1. Memberikan ringkasan tingkat eksekutif mengenai utilisasi kapasitas pabrik, throughput stasiun (Cutting, Sewing, Washing, Finishing), dan performa pengiriman SJP.
2. Memberikan rekomendasi strategis mitigasi risiko keterlambatan deadline dan peringatan dini selisih barang maklun.
3. Menjawab secara ringkas, lugas, berbasis angka riil, dan memberikan actionable insight untuk Owner.""",

    "FINANCE": """Anda adalah AI Finance & Costing Specialist PT. Chikal Jaya Makmur.
Fokus Anda adalah:
1. Menganalisis margin profit CMT (Cut-Make-Trim), efisiensi biaya bahan baku, dan valuasi aset gudang.
2. Memeriksa pengeluaran upah borongan finishing (Steam Johan, Lubang Kancing, Lipat, Packing) dan persiapan potong.
3. Memberikan audit faktur Form WI dan proyeksi arus kas tagihan SJP.""",

    "PRODUCTION": """Anda adalah AI Production & PPIC Strategist PT. Chikal Jaya Makmur.
Fokus Anda adalah:
1. Memantau alur sekuensial WIP: Meja Potong -> Print Mentah (Mas Kirno) -> Bordir Mentah (CJM/Ko Dede) -> Jahit Maklun (Anis/Pa Ato/Al-Itihad) -> Washing (Anugrah/Rite Clean) -> Bordir Jadi (Pedro) -> Finishing.
2. Mendeteksi kemacetan antrean (*bottleneck*) dan memberikan rekomendasi alokasi beban jahit.
3. Menghitung efisiensi konsumsi kain (Yard/Pcs) dan yield meja potong Bu Nani.""",

    "SECURITY": """Anda adalah AI Cyber Security & Forensic Sentinel PT. Chikal Jaya Makmur.
Fokus Anda adalah:
1. Memeriksa integritas data rekonsiliasi vendor maklun: Kirim - (Terima + Rijek) = Selisih. Jika ada selisih, tandai sebagai vendor berisiko.
2. Menganalisis anomali log login (di luar jam 07:00-20:00 WIB atau lokasi/IP yang tidak wajar).
3. Memberikan rekomendasi kepatuhan SOP pabrik dan deteksi dini kecurangan (*fraud prevention*)."""
}


def build_factory_grounded_context(db: Session) -> str:
    """
    Mengambil data riil live dari database untuk diinjeksi ke dalam Large Context Window Gemini/Claude.
    Ini menjamin AI tidak berhalusinasi dan selalu menjawab berbasis transaksi riil pabrik.
    """
    try:
        # 1. Sales Orders
        sos = db.query(models.SalesOrder).order_by(models.SalesOrder.created_at.desc()).limit(15).all()
        so_summary = []
        for so in sos:
            so_summary.append({
                "so_number": so.so_number,
                "style": so.style_name,
                "category": so.item_category,
                "target_qty": so.order_qty,
                "status": so.status,
                "deadline": str(so.deadline) if so.deadline else "N/A"
            })

        # 2. Stok Kain & Bahan Kritis
        items = db.query(models.InventoryItem).order_by(models.InventoryItem.current_stock.asc()).limit(10).all()
        item_summary = []
        for it in items:
            item_summary.append({
                "code": it.item_code,
                "desc": it.description,
                "stock": f"{it.current_stock} {it.unit}",
                "min_alert": it.min_stock_alert,
                "is_low": it.current_stock <= (it.min_stock_alert or 50.0)
            })

        # 3. Selisih Subkon WIP & Discrepancies
        discrepant_wip = db.query(models.WIPMovement).filter(
            models.WIPMovement.balance_discrepancy > 0
        ).limit(10).all()
        wip_summary = []
        for w in discrepant_wip:
            wip_summary.append({
                "so_id": w.so_id,
                "stage": w.stage_name,
                "dispatched": w.qty_dispatched,
                "received": w.qty_received,
                "reject": w.qty_reject,
                "discrepancy_lost": w.balance_discrepancy,
                "status": w.status
            })

        # 4. Pengiriman SJP Terakhir
        shipments = db.query(models.Shipment).order_by(models.Shipment.shipment_date.desc()).limit(5).all()
        ship_summary = []
        for s in shipments:
            ship_summary.append({
                "sjp_no": s.surat_jalan_no,
                "qty": s.total_qty_shipped,
                "date": str(s.shipment_date),
                "invoice_total": s.total_invoice_amount
            })

        context_str = f"""
=== DATA LIVE DATABASE PT. CHIKAL JAYA MAKMUR (MASTER GARMENT) ===
1. Sales Orders Aktif ({len(so_summary)} Batch Terakhir):
{json.dumps(so_summary, indent=2)}

2. Status Stok Gudang (Item Kritis):
{json.dumps(item_summary, indent=2)}

3. Vendor Subkon dengan Selisih Hilang (Discrepancy Flags):
{json.dumps(wip_summary, indent=2) if wip_summary else "Semua pengiriman subkon klop 100% tanpa selisih."}

4. Riwayat Surat Jalan Pengiriman (SJP):
{json.dumps(ship_summary, indent=2)}
===================================================================
"""
        return context_str
    except Exception as e:
        return f"Catatan: Terjadi kendala saat merangkum konteks database: {str(e)}"


def call_openrouter_api(messages: List[Dict[str, Any]], model: Optional[str] = None, max_tokens: int = 1500) -> str:
    """
    Eksekusi panggilan HTTP request ke OpenRouter API dengan fallback error handling yang aman.
    """
    api_key = OPENROUTER_API_KEY
    if not api_key:
        return (
            "⚠️ Kunci API OpenRouter (OPENROUTER_API_KEY) belum diisi pada environment Vercel / Cloud.\n\n"
            "Panduan Pengaktifan:\n"
            "1. Masukkan variable `OPENROUTER_API_KEY=sk-or-v1-...` di Project Settings Vercel / Environment Cloud Anda.\n"
            "2. Gunakan model `google/gemini-2.5-flash` atau `anthropic/claude-3.5-sonnet`.\n"
            "3. Sistem siap memproses inferensi AI cerdas multi-persona secara real-time!"
        )

    target_model = model or OPENROUTER_MODEL
    url = f"{OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"

    payload = {
        "model": target_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.3 # Low temperature for accurate, non-hallucinatory ERP reasoning
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mastergarment.id",
        "X-Title": OPENROUTER_SITE_NAME
    }

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=45) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            choices = res_json.get("choices", [])
            if choices and len(choices) > 0:
                return choices[0].get("message", {}).get("content", "Tidak ada respon dari model AI.")
            return "Respon OpenRouter kosong."
    except urllib.error.HTTPError as he:
        err_msg = he.read().decode("utf-8", errors="ignore")
        return f"⚠️ OpenRouter HTTP Error ({he.code}): {err_msg}"
    except Exception as ex:
        return f"⚠️ Gagal menghubungi OpenRouter AI: {str(ex)}"


def chat_with_persona(prompt: str, persona: str, db: Session, history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Chat cerdas multi-persona dengan injeksi Grounded Context Database pabrik.
    """
    sys_prompt = PERSONA_PROMPTS.get(persona.upper(), PERSONA_PROMPTS["EXECUTIVE"])
    grounded_context = build_factory_grounded_context(db)

    combined_system = f"{sys_prompt}\n\n{grounded_context}"

    messages = [{"role": "system", "content": combined_system}]
    if history:
        for h in history[-6:]: # Ambil 6 pesan terakhir untuk context continuity
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    messages.append({"role": "user", "content": prompt})

    return call_openrouter_api(messages)


def parse_raw_text_to_form(raw_text: str, form_type: str) -> Dict[str, Any]:
    """
    Fitur AI Smart Auto-Fill:
    Mengekstrak teks mentah (dari chat WA Buyer, lembar PO fisik, atau Tech Pack)
    menjadi JSON terstruktur yang langsung dapat dimasukkan ke Form Pendaftaran.
    """
    if form_type == "SALES_ORDER":
        prompt = f"""Ekstrak teks pesanan berikut menjadi format JSON terstruktur untuk pendaftaran Sales Order Garmen:
Teks Mentah:
\"\"\"{raw_text}\"\"\"

Kembalikan HANYA JSON murni tanpa markdown pembungkus dengan struktur:
{{
  "so_number": "Nomor SO resmi (misal SO-MG260005) atau buatkan jika belum ada",
  "style_name": "Nama Style/Model baju (misal: WIND MILD BLACK, CARGO PANTS)",
  "item_category": "LONG JEANS / SS KEMEJA / OUTER / KAOS / CELANA PENDEK",
  "color": "Warna kain (misal: BLACK, NAVY, KHAKI)",
  "order_qty": 500,
  "unit_price": 35000,
  "size_breakdown_target": {{"28": 100, "30": 200, "32": 200}},
  "bom_accessories": [{{"item": "Kancing 24L", "qty_per_pcs": 5}}, {{"item": "Resleting YKK 6 Inch", "qty_per_pcs": 1}}],
  "deadline": "YYYY-MM-DD"
}}"""
    elif form_type == "CUTTING":
        prompt = f"""Ekstrak catatan potong berikut menjadi format JSON terstruktur untuk Meja Potong:
Teks Mentah:
\"\"\"{raw_text}\"\"\"

Kembalikan HANYA JSON murni dengan struktur:
{{
  "qty_cut": 500,
  "main_fabric_used": 650.0,
  "puring_used": 50.0,
  "marker_length_yard": 12.5,
  "marker_efficiency_pct": 86.5,
  "gelaran_layers": 40,
  "fabric_waste_yards": 8.0,
  "size_breakdown_cut": {{"28": 100, "30": 200, "32": 200}}
}}"""
    else:
        prompt = f"Ekstrak teks berikut ke JSON: {raw_text}"

    messages = [
        {"role": "system", "content": "Anda adalah JSON parser data garmen yang sangat teliti. Kembalikan HANYA JSON murni valid."},
        {"role": "user", "content": prompt}
    ]

    response_text = call_openrouter_api(messages)
    # Bersihkan markdown formatting jika ada (```json ... ```)
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        return {"raw_ai_response": response_text, "parse_error": "Gagal parsing JSON murni dari AI."}


def analyze_fabric_defect_vision(image_base64: str, defect_notes: str) -> Dict[str, Any]:
    """
    Fitur AI Vision:
    Menganalisis foto cacat kain yang diupload oleh QC (Fitrah) dan memberikan rating poin ASTM 4-Point System.
    """
    messages = [
        {
            "role": "system",
            "content": "Anda adalah QC Fabric Inspector Tekstil bersertifikasi ASTM D5430 (4-Point System). Analisis foto cacat kain dan tentukan poin cacat (1, 2, 3, atau 4 poin) serta rekomendasinya."
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"Analisis foto cacat kain ini. Catatan QC: {defect_notes or 'Tidak ada catatan'}. Berikan output JSON: {{\"defect_type\": \"...\", \"defect_size_inch\": \"...\", \"astm_points\": 1-4, \"analysis\": \"...\", \"recommendation\": \"ACCEPT/REPAIR/REJECT\"}}"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}" if not image_base64.startswith("data:") else image_base64
                    }
                }
            ]
        }
    ]

    response_text = call_openrouter_api(messages)
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        return {"analysis_text": response_text}
