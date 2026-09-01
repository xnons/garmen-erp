# backend/routers/reports.py
"""
Laporan agregat lintas-modul: produksi, keuangan, dan scorecard vendor subcon.
Semua endpoint mengembalikan JSON (frontend meng-export ke Excel sendiri via
utils/exportUtils). Rentang tanggal opsional (default: 90 hari terakhir).
"""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
import models
from core.security import get_current_user
from core.deps import require_roles

router = APIRouter(prefix="/api/reports", tags=["Laporan & Analitik"])

_STAGE_LABELS = {
    "CUTTING": "Meja Potong",
    "PRINT_MENTAH": "Print Mentah",
    "EMBROIDERY_MENTAH": "Bordir Mentah",
    "SEWING": "Jahit",
    "SEWING_INTERNAL": "Jahit Internal",
    "SEWING_MAKLUN": "Jahit Maklun",
    "WASHING": "Washing",
    "EMBROIDERY_JADI": "Bordir Jadi",
    "FINISHING": "Finishing",
    "PACKING": "Packing",
}


def _range(start: Optional[date], end: Optional[date]) -> tuple[date, date]:
    # Default 1 tahun: siklus order garmen berlangsung berbulan-bulan.
    end = end or date.today()
    start = start or (end - timedelta(days=365))
    return start, end


@router.get("/production-summary")
def production_summary(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(get_current_user),
):
    start, end = _range(start, end)

    # 1. Output per tahapan (WIP subcon: qty diterima per stage)
    stage_rows = (
        db.query(
            models.WIPMovement.stage_name,
            func.coalesce(func.sum(models.WIPMovement.qty_dispatched), 0),
            func.coalesce(func.sum(models.WIPMovement.qty_received), 0),
            func.coalesce(func.sum(models.WIPMovement.qty_reject), 0),
        )
        .filter(models.WIPMovement.dispatch_date >= start,
                models.WIPMovement.dispatch_date <= end)
        .group_by(models.WIPMovement.stage_name)
        .all()
    )
    by_stage = [
        {
            "stage": s or "-",
            "label": _STAGE_LABELS.get(s, s or "-"),
            "dispatched": int(disp),
            "received": int(rec),
            "reject": int(rej),
        }
        for s, disp, rec, rej in stage_rows
    ]

    # 2. Yield meja potong: kain terpakai vs qty potong + persen afval
    cut_q = db.query(
        func.coalesce(func.sum(models.CuttingRecord.qty_cut), 0),
        func.coalesce(func.sum(models.CuttingRecord.main_fabric_used), 0.0),
        func.coalesce(func.sum(models.CuttingRecord.fabric_waste_yards), 0.0),
    ).filter(models.CuttingRecord.cutting_date >= start,
             models.CuttingRecord.cutting_date <= end).first()
    qty_cut, fabric_used, fabric_waste = int(cut_q[0]), float(cut_q[1]), float(cut_q[2])
    cutting_yield = {
        "qty_cut": qty_cut,
        "fabric_used_yard": round(fabric_used, 2),
        "fabric_waste_yard": round(fabric_waste, 2),
        "consumption_per_pcs": round(fabric_used / qty_cut, 3) if qty_cut else 0.0,
        "waste_pct": round((fabric_waste / fabric_used) * 100, 2) if fabric_used else 0.0,
    }

    # 3. On-time delivery: SO SHIPPED yang dikirim <= deadline
    shipped_sos = (
        db.query(models.SalesOrder, func.min(models.Shipment.shipment_date))
        .join(models.Shipment, models.Shipment.so_id == models.SalesOrder.id)
        .filter(models.SalesOrder.status.in_(["SHIPPED", "CLOSED"]))
        .group_by(models.SalesOrder.id)
        .all()
    )
    on_time = late = 0
    for so, ship_date in shipped_sos:
        if so.deadline and ship_date:
            if ship_date <= so.deadline:
                on_time += 1
            else:
                late += 1
    delivered = on_time + late
    delivery = {
        "delivered_orders": delivered,
        "on_time": on_time,
        "late": late,
        "on_time_pct": round((on_time / delivered) * 100, 1) if delivered else 0.0,
    }

    # 4. WIP aging: movement belum COMPLETED, umur sejak dispatch
    today = date.today()
    open_moves = (
        db.query(models.WIPMovement)
        .filter(models.WIPMovement.status.notin_(["COMPLETED"]))
        .all()
    )
    buckets = {"0-7": 0, "8-14": 0, "15-30": 0, ">30": 0}
    for m in open_moves:
        if not m.dispatch_date:
            continue
        age = (today - m.dispatch_date).days
        key = "0-7" if age <= 7 else "8-14" if age <= 14 else "15-30" if age <= 30 else ">30"
        buckets[key] += 1
    wip_aging = [{"bucket": k, "count": v} for k, v in buckets.items()]

    return {
        "range": {"start": str(start), "end": str(end)},
        "by_stage": by_stage,
        "cutting_yield": cutting_yield,
        "delivery": delivery,
        "wip_aging": wip_aging,
    }


@router.get("/financial-summary")
def financial_summary(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["FINANCE", "OWNER", "DEVELOPER", "ADMIN"])),
):
    start, end = _range(start, end)

    invoice_total = db.query(func.coalesce(func.sum(models.Shipment.total_invoice_amount), 0.0)) \
        .filter(models.Shipment.shipment_date >= start, models.Shipment.shipment_date <= end).scalar() or 0.0
    shipped_qty = db.query(func.coalesce(func.sum(models.Shipment.total_qty_shipped), 0)) \
        .filter(models.Shipment.shipment_date >= start, models.Shipment.shipment_date <= end).scalar() or 0

    piece_wages = db.query(func.coalesce(func.sum(models.PieceRateWage.total_wage), 0.0)) \
        .filter(models.PieceRateWage.work_date >= start, models.PieceRateWage.work_date <= end).scalar() or 0.0
    borongan_wages = db.query(func.coalesce(func.sum(models.LogOutputBorongan.subtotal_rp), 0.0)) \
        .filter(models.LogOutputBorongan.tanggal >= start, models.LogOutputBorongan.tanggal <= end,
                models.LogOutputBorongan.is_deleted == False,
                models.LogOutputBorongan.status_verifikasi == "APPROVED").scalar() or 0.0

    reject_loss = db.query(func.coalesce(func.sum(models.RejectLog.total_loss), 0.0)).scalar() or 0.0

    total_wage = float(piece_wages) + float(borongan_wages)
    gross_margin = float(invoice_total) - total_wage - float(reject_loss)

    # Margin estimasi per SO (nilai kontrak - upah satuan SO - kerugian rijek SO)
    per_so = []
    for so in db.query(models.SalesOrder).order_by(models.SalesOrder.created_at.desc()).limit(50).all():
        so_wage = db.query(func.coalesce(func.sum(models.PieceRateWage.total_wage), 0.0)) \
            .filter(models.PieceRateWage.so_id == so.id).scalar() or 0.0
        so_reject = db.query(func.coalesce(func.sum(models.RejectLog.total_loss), 0.0)) \
            .filter(models.RejectLog.so_id == so.id).scalar() or 0.0
        so_invoice = db.query(func.coalesce(func.sum(models.Shipment.total_invoice_amount), 0.0)) \
            .filter(models.Shipment.so_id == so.id).scalar() or 0.0
        contract_val = float(so.total_order_value or 0.0) or float((so.order_qty or 0) * (so.unit_price or 0.0))
        per_so.append({
            "so_number": so.so_number,
            "style_name": so.style_name,
            "status": so.status,
            "contract_value": round(contract_val, 0),
            "invoiced": round(float(so_invoice), 0),
            "wage_cost": round(float(so_wage), 0),
            "reject_loss": round(float(so_reject), 0),
            "est_margin": round(contract_val - float(so_wage) - float(so_reject), 0),
        })

    return {
        "range": {"start": str(start), "end": str(end)},
        "invoice_total": round(float(invoice_total), 0),
        "shipped_qty": int(shipped_qty),
        "wage_piece_rate": round(float(piece_wages), 0),
        "wage_borongan_approved": round(float(borongan_wages), 0),
        "wage_total": round(total_wage, 0),
        "reject_loss": round(float(reject_loss), 0),
        "gross_margin_estimate": round(gross_margin, 0),
        "per_sales_order": per_so,
    }


@router.get("/vendor-scorecard")
def vendor_scorecard(
    db: Session = Depends(get_db),
    current_user: models.Karyawan = Depends(require_roles(["PPIC", "ADMIN", "OWNER", "DEVELOPER", "FINANCE"])),
):
    partners = {p.id: p for p in db.query(models.Partner).all()}
    rows = {}
    for m in db.query(models.WIPMovement).filter(models.WIPMovement.partner_id.isnot(None)).all():
        pid = m.partner_id
        r = rows.setdefault(pid, {
            "partner_id": pid,
            "partner_name": partners[pid].name if pid in partners else "-",
            "category": partners[pid].category if pid in partners else "-",
            "movements": 0, "dispatched": 0, "received": 0, "reject": 0,
            "discrepancy": 0, "on_time": 0, "completed": 0,
        })
        r["movements"] += 1
        r["dispatched"] += m.qty_dispatched or 0
        r["received"] += m.qty_received or 0
        r["reject"] += m.qty_reject or 0
        r["discrepancy"] += m.balance_discrepancy or 0
        if m.status in ("COMPLETED", "PARTIAL_RECEIVED"):
            r["completed"] += 1

    scorecard = []
    for r in rows.values():
        disp = r["dispatched"] or 1
        r["loss_rate_pct"] = round((r["discrepancy"] / disp) * 100, 2)
        r["reject_rate_pct"] = round((r["reject"] / disp) * 100, 2)
        # Skor sederhana: 100 - penalti selisih & rijek
        r["score"] = max(0, round(100 - r["loss_rate_pct"] * 3 - r["reject_rate_pct"] * 2, 1))
        r["risk"] = "TINGGI" if r["discrepancy"] > 0 or r["reject_rate_pct"] > 5 else "AMAN"
        scorecard.append(r)

    scorecard.sort(key=lambda x: x["score"])
    return {"vendors": scorecard}
