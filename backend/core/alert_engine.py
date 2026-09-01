"""
Alert engine — memindai kondisi risiko lintas modul dan membuat baris
`Notification`. Idempotent: memakai `dedup_key`, tidak membuat notifikasi baru
selama masih ada yang belum dibaca dengan key yang sama.

Dipanggil saat startup (lifespan) dan lewat POST /api/notifications/scan
(untuk cron eksternal / Render Cron). Tidak ada scheduler in-process.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

import models


def _emit(db: Session, *, type_: str, severity: str, title: str, body: str,
          target_roles: str, ref_type: str | None, ref_id: str | None,
          menu_hint: str | None, dedup_key: str) -> bool:
    """Buat notifikasi jika belum ada yang belum-dibaca dengan dedup_key sama."""
    exists = (
        db.query(models.Notification.id)
        .filter(models.Notification.dedup_key == dedup_key,
                models.Notification.is_read == False)
        .first()
    )
    if exists:
        return False
    db.add(models.Notification(
        type=type_, severity=severity, title=title, body=body,
        target_roles=target_roles, ref_type=ref_type, ref_id=ref_id,
        menu_hint=menu_hint, dedup_key=dedup_key,
    ))
    return True


def scan_readonly(db: Session, *, limit_per_group: int = 8) -> dict:
    """
    Versi baca-saja dari pemindai risiko — TIDAK membuat notifikasi, TIDAK commit.
    Dipakai kartu "Perlu Perhatian" di dashboard.
    """
    today = date.today()
    out: dict = {
        "deadline": [], "low_stock": [], "vendor_discrepancy": [],
        "counts": {}, "scanned_at": datetime.utcnow().isoformat(),
    }

    open_sos = (
        db.query(models.SalesOrder)
        .filter(models.SalesOrder.status.notin_(["SHIPPED", "CLOSED"]),
                models.SalesOrder.deadline.isnot(None))
        .all()
    )
    dl = []
    for so in open_sos:
        days_left = (so.deadline - today).days
        if days_left <= 7:
            dl.append({
                "so_number": so.so_number, "style_name": so.style_name,
                "status": so.status, "deadline": so.deadline.isoformat(),
                "days_left": days_left,
                "severity": "CRITICAL" if days_left <= 3 else "WARNING",
            })
    dl.sort(key=lambda x: x["days_left"])
    out["deadline"] = dl[:limit_per_group]

    low = (
        db.query(models.InventoryItem)
        .filter(models.InventoryItem.current_stock <= models.InventoryItem.min_stock_alert)
        .order_by((models.InventoryItem.current_stock - models.InventoryItem.min_stock_alert).asc())
        .all()
    )
    out["low_stock"] = [{
        "item_code": it.item_code, "description": it.description,
        "current_stock": it.current_stock, "min_stock_alert": it.min_stock_alert,
        "unit": it.unit, "rack_location": it.rack_location,
    } for it in low[:limit_per_group]]

    disc = (
        db.query(models.WIPMovement)
        .filter((models.WIPMovement.balance_discrepancy > 0) |
                (models.WIPMovement.status == "DISCREPANCY_FLAG"))
        .order_by(models.WIPMovement.balance_discrepancy.desc())
        .all()
    )
    out["vendor_discrepancy"] = [{
        "id": str(m.id),
        "so_number": m.sales_order.so_number if m.sales_order else m.so_id,
        "vendor": m.partner.name if m.partner else "Internal",
        "stage_name": m.stage_name,
        "qty_dispatched": m.qty_dispatched, "qty_received": m.qty_received,
        "qty_reject": m.qty_reject, "balance_discrepancy": m.balance_discrepancy,
    } for m in disc[:limit_per_group]]

    out["counts"] = {
        "deadline": len(dl),
        "low_stock": len(low),
        "vendor_discrepancy": len(disc),
        "total": len(dl) + len(low) + len(disc),
    }
    return out


def run_scan(db: Session) -> dict:
    """Jalankan semua pemindai. Mengembalikan ringkasan jumlah alert per jenis."""
    today = date.today()
    created = {"DEADLINE_OVERDUE": 0, "DEADLINE_SOON": 0, "LOW_STOCK": 0,
              "VENDOR_DISCREPANCY": 0, "SECURITY_LOGIN": 0}

    # --- 1. Sales Order: overdue & mendekati deadline ---
    open_sos = (
        db.query(models.SalesOrder)
        .filter(models.SalesOrder.status.notin_(["SHIPPED", "CLOSED"]),
                models.SalesOrder.deadline.isnot(None))
        .all()
    )
    for so in open_sos:
        days_left = (so.deadline - today).days
        if days_left < 0:
            if _emit(db, type_="DEADLINE_OVERDUE", severity="CRITICAL",
                     title=f"SO {so.so_number} LEWAT deadline {abs(days_left)} hari",
                     body=f"Style {so.style_name} — status masih {so.status}. Deadline {so.deadline}.",
                     target_roles="OWNER,ADMIN,PPIC,DEVELOPER",
                     ref_type="SO", ref_id=so.so_number, menu_hint="ppic-so",
                     dedup_key=f"DEADLINE_OVERDUE:{so.id}"):
                created["DEADLINE_OVERDUE"] += 1
        elif days_left <= 7:
            sev = "CRITICAL" if days_left <= 3 else "WARNING"
            if _emit(db, type_="DEADLINE_SOON", severity=sev,
                     title=f"SO {so.so_number} deadline {days_left} hari lagi",
                     body=f"Style {so.style_name} — status {so.status}. Deadline {so.deadline}.",
                     target_roles="OWNER,ADMIN,PPIC,DEVELOPER",
                     ref_type="SO", ref_id=so.so_number, menu_hint="ppic-so",
                     dedup_key=f"DEADLINE_SOON:{so.id}:{days_left <= 3}"):
                created["DEADLINE_SOON"] += 1

    # --- 2. Stok kain / trims di bawah batas ---
    low_fabric = (
        db.query(models.InventoryItem)
        .filter(models.InventoryItem.current_stock <= models.InventoryItem.min_stock_alert)
        .all()
    )
    for it in low_fabric:
        if _emit(db, type_="LOW_STOCK", severity="WARNING",
                 title=f"Stok kain menipis: {it.description[:60]}",
                 body=f"Sisa {it.current_stock} {it.unit} (batas {it.min_stock_alert}). Rak {it.rack_location}.",
                 target_roles="OWNER,ADMIN,GUDANG,PPIC,DEVELOPER",
                 ref_type="ITEM", ref_id=it.item_code, menu_hint="warehouse-fabric",
                 dedup_key=f"LOW_STOCK:item:{it.id}"):
            created["LOW_STOCK"] += 1

    low_trims = (
        db.query(models.BahanBaku)
        .filter(models.BahanBaku.stok_saat_ini <= models.BahanBaku.stok_minimum)
        .all()
    )
    for b in low_trims:
        if _emit(db, type_="LOW_STOCK", severity="WARNING",
                 title=f"Stok aksesoris menipis: {b.nama_item[:60]}",
                 body=f"Sisa {b.stok_saat_ini} {b.satuan} (batas {b.stok_minimum}).",
                 target_roles="OWNER,ADMIN,GUDANG,DEVELOPER",
                 ref_type="ITEM", ref_id=b.kode_sku, menu_hint="inventaris",
                 dedup_key=f"LOW_STOCK:trim:{b.id}"):
            created["LOW_STOCK"] += 1

    # --- 3. Selisih vendor subcon ---
    disc_moves = (
        db.query(models.WIPMovement)
        .filter((models.WIPMovement.balance_discrepancy > 0) |
                (models.WIPMovement.status == "DISCREPANCY_FLAG"))
        .all()
    )
    for m in disc_moves:
        so_num = m.sales_order.so_number if m.sales_order else m.so_id
        vendor = m.partner.name if m.partner else "Internal"
        if _emit(db, type_="VENDOR_DISCREPANCY", severity="CRITICAL",
                 title=f"Selisih {m.balance_discrepancy} pcs — {vendor} ({m.stage_name})",
                 body=f"SO {so_num}: kirim {m.qty_dispatched}, terima {m.qty_received}, rijek {m.qty_reject}.",
                 target_roles="OWNER,ADMIN,PPIC,DEVELOPER",
                 ref_type="WIP_MOVEMENT", ref_id=str(m.id), menu_hint="wip-control-tower",
                 dedup_key=f"VENDOR_DISCREPANCY:{m.id}"):
            created["VENDOR_DISCREPANCY"] += 1

    # --- 4. Anomali login (24 jam terakhir) ---
    since = datetime.utcnow() - timedelta(hours=24)
    blocked = (
        db.query(models.LogLogin)
        .filter(models.LogLogin.timestamp >= since,
                models.LogLogin.status.in_(["BLOCKED_OFF_HOURS", "BLOCKED_INACTIVE", "BLOCKED_OFFLINE_USER"]))
        .all()
    )
    for lg in blocked:
        if _emit(db, type_="SECURITY_LOGIN", severity="WARNING",
                 title=f"Login diblokir: {lg.username} ({lg.status})",
                 body=f"{lg.keterangan or ''} | {lg.lokasi or '-'} | {lg.device_info or '-'}",
                 target_roles="OWNER,DEVELOPER",
                 ref_type="LOGIN", ref_id=str(lg.id), menu_hint="audit-log",
                 dedup_key=f"SECURITY_LOGIN:{lg.id}"):
            created["SECURITY_LOGIN"] += 1

    # brute force: >=5 FAILED_PASSWORD utk username sama dalam 24 jam
    from sqlalchemy import func as _f
    brute = (
        db.query(models.LogLogin.username, _f.count(models.LogLogin.id))
        .filter(models.LogLogin.timestamp >= since,
                models.LogLogin.status == "FAILED_PASSWORD")
        .group_by(models.LogLogin.username)
        .having(_f.count(models.LogLogin.id) >= 5)
        .all()
    )
    for uname, cnt in brute:
        if _emit(db, type_="SECURITY_LOGIN", severity="CRITICAL",
                 title=f"Dugaan brute-force: {cnt}x gagal login '{uname}'",
                 body=f"{cnt} percobaan password salah untuk '{uname}' dalam 24 jam terakhir.",
                 target_roles="OWNER,DEVELOPER",
                 ref_type="LOGIN", ref_id=uname or "-", menu_hint="audit-log",
                 dedup_key=f"SECURITY_LOGIN:brute:{uname}:{today}"):
            created["SECURITY_LOGIN"] += 1

    db.commit()
    total = sum(created.values())
    return {"created": created, "total_created": total, "scanned_at": datetime.utcnow().isoformat()}
