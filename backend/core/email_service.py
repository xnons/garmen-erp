# backend/core/email_service.py
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import models

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
DEFAULT_RECIPIENT = os.getenv("EXECUTIVE_REPORT_EMAIL_TO", "muhammadtegarsaputra24@gmail.com")

def get_email_from() -> str:
    user = os.getenv("SMTP_USER", "").strip()
    if user:
        return f"PT. Chikal Jaya Makmur ERP <{user}>"
    return os.getenv("EMAIL_FROM", "PT. Chikal Jaya Makmur ERP <muhammadtegarsaputra24@gmail.com>")


def generate_executive_html_report(db: Session, recipient_name: str = "Muhammad Tegar Saputra") -> str:
    """
    Menghasilkan template email HTML eksekutif yang elegan dan responsif.
    """
    wib_now = datetime.now(timezone(timedelta(hours=7))).strftime("%A, %d %B %Y - %H:%M WIB")

    # Data Agregasi
    sos = db.query(models.SalesOrder).all()
    total_so = len(sos)
    total_target_pcs = sum(s.order_qty for s in sos)

    cuttings = db.query(models.CuttingRecord).all()
    total_cut_pcs = sum(c.qty_cut for c in cuttings)

    shipments = db.query(models.Shipment).all()
    total_shipped_pcs = sum(s.total_qty_shipped for s in shipments)
    total_invoice_rp = sum(s.total_invoice_amount for s in shipments)

    discrepancies = db.query(models.WIPMovement).filter(models.WIPMovement.balance_discrepancy > 0).all()
    total_lost_pcs = sum(d.balance_discrepancy for d in discrepancies)

    # HTML Generator
    discrepancy_rows = ""
    if discrepancies:
        for d in discrepancies[:5]:
            so_num = d.sales_order.so_number if d.sales_order else "N/A"
            vendor = d.partner.name if d.partner else "Internal"
            discrepancy_rows += f"""
            <tr style="border-bottom: 1px solid #fee2e2; background-color: #fef2f2;">
                <td style="padding: 10px 14px; font-weight: bold; color: #991b1b;">{so_num}</td>
                <td style="padding: 10px 14px; color: #7f1d1d;">{d.stage_name} ({vendor})</td>
                <td style="padding: 10px 14px; text-align: right; color: #475569;">{d.qty_dispatched} pcs</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #dc2626;">+{d.balance_discrepancy} pcs HILANG</td>
            </tr>
            """
    else:
        discrepancy_rows = """
        <tr>
            <td colspan="4" style="padding: 16px; text-align: center; color: #16a34a; font-weight: bold;">
                ✅ Seluruh pengiriman subkon tercatat klop 100% tanpa selisih barang hilang!
            </td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Executive Briefing PT. Chikal Jaya Makmur</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #e2e8f0;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            
            <!-- HEADER -->
            <div style="background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%); padding: 28px 32px; border-bottom: 1px solid #4338ca;">
                <div style="font-size: 11px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                    PT. CHIKAL JAYA MAKMUR • MASTER GARMENT ERP
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                    Executive Daily Briefing & Telemetri Pabrik
                </h1>
                <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">
                    📅 {wib_now} | Ditujukan kepada: <strong style="color: #ffffff;">{recipient_name}</strong>
                </div>
            </div>

            <!-- CONTENT BODY -->
            <div style="padding: 28px 32px;">

                <!-- 4 KPI CARDS -->
                <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom: 24px;">
                    <tr>
                        <td width="50%" style="background-color: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #334155;">
                            <div style="font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Total Batch SO</div>
                            <div style="font-size: 24px; font-weight: 900; color: #ffffff; margin-top: 4px;">{total_so} <span style="font-size: 13px; font-weight: normal; color: #818cf8;">Order</span></div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Target: {total_target_pcs:,} pcs</div>
                        </td>
                        <td width="50%" style="background-color: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #334155;">
                            <div style="font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Hasil Meja Potong</div>
                            <div style="font-size: 24px; font-weight: 900; color: #f59e0b; margin-top: 4px;">{total_cut_pcs:,} <span style="font-size: 13px; font-weight: normal; color: #fcd34d;">Pcs</span></div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Meja Bu Nani Live</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%" style="background-color: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #334155;">
                            <div style="font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Total Pengiriman SJP</div>
                            <div style="font-size: 24px; font-weight: 900; color: #10b981; margin-top: 4px;">{total_shipped_pcs:,} <span style="font-size: 13px; font-weight: normal; color: #6ee7b7;">Pcs</span></div>
                            <div style="font-size: 11px; color: #34d399; margin-top: 2px;">Faktur: Rp {total_invoice_rp:,.0f}</div>
                        </td>
                        <td width="50%" style="background-color: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid { '#7f1d1d' if total_lost_pcs > 0 else '#334155' }; background: { 'rgba(239, 68, 68, 0.1)' if total_lost_pcs > 0 else '#0f172a' };">
                            <div style="font-size: 11px; color: { '#f87171' if total_lost_pcs > 0 else '#94a3b8' }; font-weight: bold; text-transform: uppercase;">Selisih Subkon Hilang</div>
                            <div style="font-size: 24px; font-weight: 900; color: { '#ef4444' if total_lost_pcs > 0 else '#10b981' }; margin-top: 4px;">{total_lost_pcs} <span style="font-size: 13px; font-weight: normal;">Pcs</span></div>
                            <div style="font-size: 11px; color: { '#fca5a5' if total_lost_pcs > 0 else '#64748b' }; margin-top: 2px;">Status: { '⚠️ PERLU TINDAKAN' if total_lost_pcs > 0 else 'Aman' }</div>
                        </td>
                    </tr>
                </table>

                <!-- SECTION ALERT DISCREPANCY -->
                <div style="margin-top: 24px;">
                    <h3 style="color: #ffffff; font-size: 15px; margin-bottom: 12px; display: flex; align-items: center;">
                        🚨 Radar Pengawasan Selisih Subkon (Discrepancy Log)
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #ffffff; border-radius: 10px; overflow: hidden; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 11px; font-weight: bold;">
                                <th style="padding: 10px 14px; text-align: left;">Code SO</th>
                                <th style="padding: 10px 14px; text-align: left;">Tahapan Vendor</th>
                                <th style="padding: 10px 14px; text-align: right;">Kirim</th>
                                <th style="padding: 10px 14px; text-align: right;">Selisih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discrepancy_rows}
                        </tbody>
                    </table>
                </div>

                <!-- FOOTER -->
                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center;">
                    <p style="margin: 0;">Laporan otomatis ini dihasilkan oleh <strong>Master Garment ERP Engine</strong>.</p>
                    <p style="margin: 4px 0 0 0;">Kawasan Industri Garmen • PT. Chikal Jaya Makmur</p>
                </div>

            </div>
        </div>
    </body>
    </html>
    """
    return html_content


def send_executive_email_briefing(
    db: Session,
    recipient_email: Optional[str] = None,
    recipient_name: Optional[str] = "Muhammad Tegar Saputra"
) -> Dict[str, Any]:
    """
    Mengirimkan email briefing eksekutif via SMTP.
    """
    target_email = recipient_email or DEFAULT_RECIPIENT
    html_body = generate_executive_html_report(db, recipient_name or "Muhammad Tegar Saputra")

    if not SMTP_USER or not SMTP_PASS:
        # Jika belum memasukkan credential SMTP, kembalikan simulasi sukses dan template HTML
        return {
            "status": "SIMULATION_SUCCESS",
            "message": "⚠️ Variabel SMTP_USER dan SMTP_PASS belum diisi di environment Vercel/Cloud. Laporan HTML telah berhasil digenerate!",
            "recipient": target_email,
            "preview_html_length": len(html_body)
        }

    try:
        from_email = get_email_from()
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"📊 Executive Daily Briefing PT. Chikal Jaya Makmur — {datetime.now().strftime('%d/%m/%Y')}"
        msg["From"] = from_email
        msg["To"] = target_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER or from_email, [target_email], msg.as_string())

        return {
            "status": "SENT_SUCCESSFULLY",
            "message": f"Laporan eksekutif berhasil dikirim ke {target_email}!",
            "recipient": target_email
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Gagal mengirim email: {str(e)}",
            "recipient": target_email
        }
