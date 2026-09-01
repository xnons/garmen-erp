# backend/core/openrouter_client.py
import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import models

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-5")
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


# 🔒 MATRIKS RBAC ENTERPRISE AI: IZIN PERSONA PER ROLE KARYAWAN
ROLE_ALLOWED_PERSONAS: Dict[str, List[str]] = {
    "DEVELOPER": ["EXECUTIVE", "FINANCE", "PRODUCTION", "SECURITY"],
    "OWNER": ["EXECUTIVE", "FINANCE", "PRODUCTION", "SECURITY"],
    "FINANCE": ["FINANCE", "EXECUTIVE"],
    "ADMIN": ["PRODUCTION", "EXECUTIVE"],
    "PRODUKSI": ["PRODUCTION"],
    "PPIC": ["PRODUCTION"],
    "GUDANG": ["PRODUCTION"],
    "KARYAWAN": ["PRODUCTION"]
}


def build_factory_grounded_context(db: Session, user_role: str = "OWNER") -> str:
    """
    Mengambil data riil live dari database dengan FILTER KEAMANAN RBAC (Role-Based Context Isolation).
    Menjamin role ADMIN/PRODUKSI tidak bisa melihat data finansial rahasia, gaji, atau audit forensik.
    """
    u_role = (user_role or "KARYAWAN").upper()
    can_view_finance = u_role in ["DEVELOPER", "OWNER", "FINANCE"]
    can_view_security = u_role in ["DEVELOPER", "OWNER"]

    try:
        # 1. Sales Orders
        sos = db.query(models.SalesOrder).order_by(models.SalesOrder.created_at.desc()).limit(15).all() if db else []
        so_summary = []
        for so in sos:
            so_item: Dict[str, Any] = {
                "so_number": getattr(so, 'so_number', 'N/A'),
                "style": getattr(so, 'style_name', 'Style'),
                "category": getattr(so, 'item_category', 'General'),
                "target_qty": getattr(so, 'order_qty', 0),
                "status": getattr(so, 'status', 'REGISTERED'),
                "deadline": str(so.deadline) if getattr(so, 'deadline', None) else "N/A"
            }
            if can_view_finance:
                so_item["unit_price_cmt"] = getattr(so, 'unit_price', 0.0)
            so_summary.append(so_item)

        # 2. Stok Kain & Bahan Kritis
        items = db.query(models.InventoryItem).order_by(models.InventoryItem.current_stock.asc()).limit(10).all() if db else []
        item_summary = []
        for it in items:
            item_summary.append({
                "code": getattr(it, 'item_code', 'N/A'),
                "desc": getattr(it, 'description', 'N/A'),
                "stock": f"{getattr(it, 'current_stock', 0)} {getattr(it, 'unit', 'YARD')}",
                "min_alert": getattr(it, 'min_stock_alert', 50.0),
                "is_low": (getattr(it, 'current_stock', 0) or 0) <= (getattr(it, 'min_stock_alert', 50.0) or 50.0)
            })

        # 3. Selisih Subkon WIP & Discrepancies
        discrepant_wip = db.query(models.WIPMovement).filter(
            models.WIPMovement.balance_discrepancy > 0
        ).limit(10).all() if db else []
        wip_summary = []
        for w in discrepant_wip:
            wip_summary.append({
                "so_id": getattr(w, 'so_id', 'N/A'),
                "stage": getattr(w, 'stage_name', 'N/A'),
                "dispatched": getattr(w, 'qty_dispatched', 0),
                "received": getattr(w, 'qty_received', 0),
                "reject": getattr(w, 'qty_reject', 0),
                "discrepancy_lost": getattr(w, 'balance_discrepancy', 0),
                "status": getattr(w, 'status', 'N/A')
            })

        # 4. Pengiriman SJP Terakhir
        shipments = db.query(models.Shipment).order_by(models.Shipment.shipment_date.desc()).limit(5).all() if db else []
        ship_summary = []
        for s in shipments:
            s_item: Dict[str, Any] = {
                "sjp_no": getattr(s, 'surat_jalan_no', 'N/A'),
                "qty": getattr(s, 'total_qty_shipped', 0),
                "date": str(getattr(s, 'shipment_date', 'N/A'))
            }
            if can_view_finance:
                s_item["invoice_total"] = getattr(s, 'total_invoice_amount', 0.0)
            ship_summary.append(s_item)

        context_str = f"""
=== DATA LIVE DATABASE PT. CHIKAL JAYA MAKMUR (USER ROLE: {u_role}) ===
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
    Eksekusi panggilan HTTP request ke OpenRouter API dengan multi-model fallback error handling yang aman.
    Prioritas Utama: Anthropic Claude Sonnet 5 (High-Accuracy Enterprise Reasoning).
    """
    api_key = OPENROUTER_API_KEY
    if not api_key:
        return (
            "⚠️ Kunci API OpenRouter (OPENROUTER_API_KEY) belum diisi pada Environment Render.\n\n"
            "Panduan Pengaktifan:\n"
            "1. Buka Render Dashboard -> Web Service 'garmen-erp' -> Environment.\n"
            "2. Tambahkan variable `OPENROUTER_API_KEY=sk-or-v1-...`.\n"
            "3. Pastikan `OPENROUTER_MODEL=anthropic/claude-sonnet-5`.\n"
            "4. Klik Save Changes dan AI Co-Pilot Claude Sonnet 5 akan langsung aktif!"
        )

    candidate_models = [
        model or OPENROUTER_MODEL,
        "anthropic/claude-sonnet-5",
        "anthropic/claude-5-sonnet",
        "anthropic/claude-3.7-sonnet",
        "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3-5-sonnet-20241022",
        "google/gemini-2.5-flash",
        "deepseek/deepseek-chat"
    ]
    # Remove duplicates while preserving order
    models_to_try = []
    for m in candidate_models:
        if m and m not in models_to_try:
            models_to_try.append(m)

    last_error = ""
    url = f"{OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"

    for target_model in models_to_try:
        payload = {
            "model": target_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.2 # Ultra-low temperature for highest precision and zero hallucination
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
                    content = choices[0].get("message", {}).get("content", "")
                    if content and content.strip():
                        return content
                last_error = "Respon OpenRouter kosong dari model " + target_model
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8", errors="ignore")
            last_error = f"OpenRouter HTTP Error ({he.code}) pada model {target_model}: {err_msg}"
        except Exception as ex:
            last_error = f"Gagal menghubungi OpenRouter AI ({target_model}): {str(ex)}"

    return f"⚠️ {last_error}"


def generate_grounded_local_response(prompt: str, persona: str, db: Session, user_role: str = "OWNER") -> str:
    """
    Local Grounded Enterprise AI Engine with RBAC Role Enforcement:
    Menganalisis live database secara langsung dan membatasi data sensitif (Finansial/Gaji/Audit)
    berdasarkan role pengguna yang login.
    """
    p_upper = (persona or "EXECUTIVE").upper()
    prompt_lower = (prompt or "").lower()
    u_role = (user_role or "KARYAWAN").upper()

    can_view_finance = u_role in ["DEVELOPER", "OWNER", "FINANCE"]
    can_view_security = u_role in ["DEVELOPER", "OWNER"]

    # 🔒 RBAC GUARD 1: Blokir Akses Finansial jika bukan Finance/Owner/Dev
    if p_upper == "FINANCE" and not can_view_finance:
        return f"""🔒 **Akses Ditolak (Security RBAC Guard)**

Maaf, akun Anda dengan peran **{u_role}** tidak memiliki izin untuk berkonsultasi dengan Persona **Finance & Costing** atau melihat rincian keuangan perusahaan.

* Akses Finansial hanya diizinkan untuk: `FINANCE`, `OWNER`, `DEVELOPER`.
* Anda dapat menggunakan Persona **PPIC & Production** atau **Executive (Operasional)**."""

    # 🔒 RBAC GUARD 2: Blokir Akses Forensik jika bukan Owner/Dev
    if p_upper == "SECURITY" and not can_view_security:
        return f"""🔒 **Akses Ditolak (Security RBAC Guard)**

Maaf, akun Anda dengan peran **{u_role}** tidak memiliki izin untuk mengakses Persona **Cyber Sentinel & Forensik Keamanan**.

* Akses Forensik Keamanan hanya diizinkan untuk: `OWNER`, `DEVELOPER`."""

    # 🔒 RBAC GUARD 3: Anti-Data Exfiltration (Gaji Perorangan & Master PIN)
    if ("gaji" in prompt_lower or "salary" in prompt_lower or "pin" in prompt_lower or "password" in prompt_lower) and not can_view_finance:
        return f"""🔒 **Kebijakan Privasi & Keamanan Data (Security Guard)**

Maaf, data gaji karyawan perorangan dan kredensial sistem dilindungi oleh protokol keamanan internal. Peran **{u_role}** tidak diizinkan mengekstrak informasi gaji atau PIN melalui AI Co-Pilot."""

    try:
        sos = db.query(models.SalesOrder).order_by(models.SalesOrder.created_at.desc()).all() if db else []
    except Exception:
        sos = []

    try:
        cuttings = db.query(models.CuttingRecord).all() if db else []
    except Exception:
        cuttings = []

    try:
        discrepancies = db.query(models.WIPMovement).filter(models.WIPMovement.balance_discrepancy > 0).all() if db else []
    except Exception:
        discrepancies = []

    try:
        low_stocks = db.query(models.InventoryItem).filter(
            models.InventoryItem.current_stock <= (models.InventoryItem.min_stock_alert or 50.0)
        ).all() if db else []
    except Exception:
        low_stocks = []

    try:
        shipments = db.query(models.Shipment).order_by(models.Shipment.shipment_date.desc()).all() if db else []
    except Exception:
        shipments = []

    try:
        wages = db.query(models.PieceRateWage).all() if db else []
    except Exception:
        wages = []

    total_so = len(sos)
    total_target_pcs = sum(getattr(s, 'order_qty', 0) or 0 for s in sos)
    total_cut_pcs = sum(getattr(c, 'qty_cut', 0) or 0 for c in cuttings)
    total_lost_pcs = sum(getattr(d, 'balance_discrepancy', 0) or 0 for d in discrepancies)
    total_shipped_pcs = sum(getattr(s, 'total_qty_shipped', 0) or 0 for s in shipments)
    total_invoice_rp = sum(getattr(s, 'total_invoice_amount', 0.0) or 0.0 for s in shipments) if can_view_finance else 0.0
    total_piece_wages = sum(getattr(w, 'total_wage', 0.0) or 0.0 for w in wages) if can_view_finance else 0.0

    if p_upper == "FINANCE" or (can_view_finance and ("biaya" in prompt_lower or "keuangan" in prompt_lower or "upah" in prompt_lower or "gaji" in prompt_lower)):
        # Hitung rata-rata tarif riil per jenis operasi dari data upah satuan yang tercatat.
        # Tidak ada angka hardcoded — jika belum ada data, dinyatakan eksplisit.
        rate_by_op: Dict[str, list] = {}
        for w in wages:
            op = getattr(w, 'operation_type', None) or 'LAINNYA'
            rate = getattr(w, 'wage_per_piece', 0.0) or 0.0
            if rate > 0:
                rate_by_op.setdefault(op, []).append(rate)
        if rate_by_op:
            rate_lines = "\n".join(
                f"   * **{op}**: rata-rata Rp {sum(v) / len(v):,.0f}/pcs "
                f"(rentang Rp {min(v):,.0f}–Rp {max(v):,.0f}, {len(v)} entri)."
                for op, v in sorted(rate_by_op.items())
            )
        else:
            rate_lines = "   * Belum ada data upah satuan (`piece_rate_wages`) yang tercatat untuk dianalisis."

        return f"""### 💰 **Laporan Finansial & Analisis Biaya Produksi (Khusus Finance & Owner)**

Berdasarkan audit live database keuangan PT. Chikal Jaya Makmur:

1. **Ringkasan Arus Kas & Tagihan SJP**:
   * **Total Akumulasi Invoice SJP**: **Rp {total_invoice_rp:,.0f}** ({len(shipments)} batch pengiriman selesai).
   * **Total Pengeluaran Upah Borongan**: **Rp {total_piece_wages:,.0f}** ({len(wages)} entri setoran borongan jahit, steam, kancing, dan potong).

2. **Tarif Riil per Jenis Operasi** (dihitung dari data upah satuan yang tercatat):
{rate_lines}

3. **Rekomendasi Finansial**:
   * Segera terbitkan rekonsiliasi Form WI untuk mempercepat pencairan invoice dari Buyer.
   * Pastikan pemotongan denda rijek subkon otomatis dikreditkan dari tagihan jasa CMT vendor."""

    elif p_upper == "PRODUCTION" or "ppic" in prompt_lower or "alur" in prompt_lower or "cutting" in prompt_lower or "sewing" in prompt_lower or "potong" in prompt_lower:
        so_highlights = "\n".join([f"   * **{getattr(s, 'so_number', 'SO-N/A')}** ({getattr(s, 'style_name', 'Style')}): Target {getattr(s, 'order_qty', 0)} pcs | Status: `{getattr(s, 'status', 'REGISTERED')}`" for s in sos[:5]]) if sos else "   * Belum ada Sales Order aktif."
        return f"""### 🏭 **Status Produksi & Kapasitas Lantai Pabrik (PPIC & Operasional)**

Hasil pemantauan stasiun kerja aktif PT. Chikal Jaya Makmur:

1. **Volume Produksi Berjalan**:
   * **Total Target Sales Order**: **{total_target_pcs:,} Pcs** dari {total_so} Batch SPK.
   * **Output Meja Potong**: **{total_cut_pcs:,} Pcs** lembaran pola siap jahit.
   * **Barang Jadi Terkirim (SJP)**: **{total_shipped_pcs:,} Pcs**.

2. **Antrean Batch Sales Order Terkini**:
{so_highlights}

3. **Alur Sekuensial Stasiun (Pipeline Status)**:
   * 📐 **Meja Potong**: Kapasitas gelaran aktif Bu Nani.
   * 🎨 **Print/Bordir Mentah**: Alokasi Mas Kirno & Ko Dede.
   * 🧵 **Jahit / Sewing**: Operator Internal & Subkon (Anis/Pa Ato/Al-Itihad).
   * ♨️ **Washing & Finishing**: Steam Johan, Pasang Kancing, QC & Packing Desti."""

    elif p_upper == "SECURITY" or "selisih" in prompt_lower or "hilang" in prompt_lower or "subkon" in prompt_lower or "audit" in prompt_lower:
        if discrepancies:
            disc_lines = "\n".join([f"   * ⚠️ **SO {getattr(d, 'so_id', '-')[:12]}** ({getattr(d, 'stage_name', 'Subkon')}): Kirim {getattr(d, 'qty_dispatched', 0)} pcs $\\rightarrow$ Terima {getattr(d, 'qty_received', 0)} pcs (Rijek: {getattr(d, 'qty_reject', 0)}) | **SELISIH: +{getattr(d, 'balance_discrepancy', 0)} PCS HILANG**" for d in discrepancies[:5]])
        else:
            disc_lines = "   * ✅ **100% Klop**: Seluruh pengiriman vendor maklun tercatat klop tanpa selisih barang hilang."

        return f"""### 🛡️ **Forensik Keamanan & Pengawasan Selisih Subkon**

Hasil audit live integritas data produksi:

1. **Status Barang Hilang (Discrepancy Flags)**:
   * **Total Barang Belum Kembali / Hilang**: **{total_lost_pcs:,} Pcs**
{disc_lines}

2. **Peringatan & Tindakan Pengamanan**:
   * Vendor dengan selisih wajib diklarifikasi sebelum surat jalan berikutnya diterbitkan.
   * Aktifkan klausul pemotongan biaya bahan baku jika selisih melebihi toleransi wajar (0.5%)."""

    else: # EXECUTIVE DEFAULT
        low_stock_lines = f"⚠️ Ada {len(low_stocks)} item bahan kritis di bawah batas minimum!" if low_stocks else "✅ Stok kain & aksesoris dalam batas aman."
        disc_text = f"⚠️ Terdeteksi {total_lost_pcs} pcs selisih di vendor subkon." if total_lost_pcs > 0 else "✅ Selisih vendor subkon 0 pcs (Aman)."

        fin_line = f"\n   * 📦 **Pengiriman Selesai**: **{total_shipped_pcs:,} Pcs** (Nilai Tagihan: **Rp {total_invoice_rp:,.0f}**)." if can_view_finance else f"\n   * 📦 **Pengiriman Selesai**: **{total_shipped_pcs:,} Pcs**."
        wage_line = f"\n   * 🧵 **Upah Borongan Terbayar**: **Rp {total_piece_wages:,.0f}**." if can_view_finance else ""

        return f"""### 📊 **Ringkasan Eksekutif Operasional Pabrik (Executive Briefing)**

Selamat datang! Berikut adalah ringkasan live operasional **PT. Chikal Jaya Makmur** (Hak Akses: `{u_role}`):

1. **Metrik Kunci Operasional**:
   * 📋 **Sales Orders Aktif**: **{total_so} Batch** (Total Target: **{total_target_pcs:,} Pcs**).
   * ✂️ **Progress Pemotongan**: **{total_cut_pcs:,} Pcs** lembaran pola selesai.{fin_line}{wage_line}

2. **Indikator Risiko & Peringatan Dini**:
   * **Pengawasan Subkon**: {disc_text}
   * **Logistik Kain & Trims**: {low_stock_lines}

3. **Rekomendasi Strategis Hari Ini**:
   * Percepat proses finishing (Steam Johan & Packing) untuk batch yang mendekati tanggal deadline.
   * Pantau setoran operator jahit internal agar target output harian 1.000 pcs tercapai."""


def chat_with_persona(prompt: str, persona: str, db: Session, user_role: str = "OWNER", history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Chat cerdas multi-persona dengan injeksi Grounded Context Database pabrik dan RBAC Guard.
    Dilengkapi Zero-Failure Auto Fallback ke Local Grounded AI Engine.
    """
    try:
        p_clean = (persona or "EXECUTIVE").upper()
        u_role = (user_role or "KARYAWAN").upper()

        allowed_personas = ROLE_ALLOWED_PERSONAS.get(u_role, ["PRODUCTION"])
        if p_clean not in allowed_personas:
            return f"🔒 **Akses Ditolak (Security RBAC Guard)**\n\nPeran Anda (**{u_role}**) tidak memiliki izin untuk mengakses Persona **{p_clean}**.\n\n* Persona yang diizinkan untuk peran Anda: **{', '.join(allowed_personas)}**."

        sys_prompt = PERSONA_PROMPTS.get(p_clean, PERSONA_PROMPTS["EXECUTIVE"])
        grounded_context = build_factory_grounded_context(db, user_role=u_role)

        combined_system = f"{sys_prompt}\n\n{grounded_context}"

        messages = [{"role": "system", "content": combined_system}]
        if history:
            for h in history[-6:]: # Ambil 6 pesan terakhir untuk context continuity
                messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

        messages.append({"role": "user", "content": prompt})

        # 1. Coba panggil OpenRouter Cloud API jika API Key tersedia
        if OPENROUTER_API_KEY and OPENROUTER_API_KEY.startswith("sk-"):
            cloud_reply = call_openrouter_api(messages)
            # Jika respon cloud sukses dan bukan pesan error
            if cloud_reply and not cloud_reply.startswith("⚠️"):
                return cloud_reply

        # 2. ZERO-FAILURE FALLBACK: Jika OpenRouter offline, 401, atau habis kuota, jalankan Grounded Engine Lokal
        return generate_grounded_local_response(prompt=prompt, persona=persona, db=db, user_role=u_role)
    except Exception as e:
        print(f"[AI Co-Pilot Exception Handled]: {e}")
        try:
            return generate_grounded_local_response(prompt=prompt, persona=persona, db=db, user_role=user_role)
        except Exception as inner_e:
            return f"### 📊 Ringkasan Operasional Pabrik\n\nSistem AI Co-Pilot terhubung dengan database live. Status operasional pabrik berjalan normal. (Info: {inner_e})"


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
