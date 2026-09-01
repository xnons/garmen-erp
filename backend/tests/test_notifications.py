"""Notifikasi & alert engine: scan, dedup, RBAC target_roles, read/read-all."""
from datetime import date, timedelta


def _seed_conditions(db):
    import models
    # SO overdue
    db.add(models.SalesOrder(so_number="SO-OD", style_name="OVERDUE", order_qty=10,
                             status="CUTTING", order_date=date(2026, 1, 1),
                             deadline=date.today() - timedelta(days=3)))
    # SO deadline besok (<=3 -> CRITICAL)
    db.add(models.SalesOrder(so_number="SO-SOON", style_name="SOON", order_qty=10,
                             status="WIP_SUBCON", order_date=date(2026, 1, 1),
                             deadline=date.today() + timedelta(days=1)))
    # stok kain kritis
    db.add(models.InventoryItem(item_code="LOW-K", description="Kain Kritis",
                                item_type="FABRIC_MAIN", current_stock=3.0, min_stock_alert=50.0))
    # selisih vendor
    so = models.SalesOrder(so_number="SO-DISC", style_name="D", order_qty=100,
                           status="WIP_SUBCON", order_date=date(2026, 1, 1))
    db.add(so)
    db.flush()
    db.add(models.WIPMovement(so_id=so.id, stage_name="SEWING_MAKLUN", sequence_order=3,
                              dispatch_date=date(2026, 1, 2), qty_dispatched=100,
                              qty_received=94, qty_reject=0, balance_discrepancy=6,
                              status="DISCREPANCY_FLAG"))
    db.commit()


def test_scan_creates_alerts(client, auth, db):
    _seed_conditions(db)
    r = client.post("/api/notifications/scan", headers=auth("admin"))
    assert r.status_code == 200, r.text
    created = r.json()["created"]
    assert created["DEADLINE_OVERDUE"] >= 1
    assert created["DEADLINE_SOON"] >= 1
    assert created["LOW_STOCK"] >= 1
    assert created["VENDOR_DISCREPANCY"] >= 1


def test_scan_is_idempotent(client, auth, db):
    _seed_conditions(db)
    first = client.post("/api/notifications/scan", headers=auth("admin")).json()["total_created"]
    second = client.post("/api/notifications/scan", headers=auth("admin")).json()["total_created"]
    assert first >= 4
    assert second == 0  # dedup: tidak ada duplikat selama belum dibaca


def test_scan_requires_admin(client, auth):
    assert client.post("/api/notifications/scan", headers=auth("produksi")).status_code == 403
    assert client.post("/api/notifications/scan").status_code == 401


def test_list_and_unread_count(client, auth, db):
    _seed_conditions(db)
    client.post("/api/notifications/scan", headers=auth("admin"))
    r = client.get("/api/notifications", headers=auth("owner"))
    assert r.status_code == 200
    body = r.json()
    assert body["unread_count"] >= 4
    assert len(body["items"]) >= 4
    assert all("severity" in n and "menu_hint" in n for n in body["items"])


def test_target_roles_filter(client, auth, db):
    """SECURITY_LOGIN hanya untuk OWNER/DEVELOPER; PPIC tak melihatnya."""
    import models
    db.add(models.LogLogin(username="attacker", status="BLOCKED_OFF_HOURS",
                           keterangan="di luar jam"))
    db.commit()
    client.post("/api/notifications/scan", headers=auth("admin"))

    owner_items = client.get("/api/notifications", headers=auth("owner")).json()["items"]
    ppic_items = client.get("/api/notifications", headers=auth("ppic")).json()["items"]
    assert any(n["type"] == "SECURITY_LOGIN" for n in owner_items)
    assert not any(n["type"] == "SECURITY_LOGIN" for n in ppic_items)


def test_mark_read_and_read_all(client, auth, db):
    _seed_conditions(db)
    client.post("/api/notifications/scan", headers=auth("admin"))
    h = auth("owner")
    items = client.get("/api/notifications", headers=h).json()["items"]
    first_id = items[0]["id"]

    assert client.post(f"/api/notifications/{first_id}/read", headers=h).status_code == 200
    after = client.get("/api/notifications", params={"unread_only": True}, headers=h).json()
    assert all(n["id"] != first_id for n in after["items"])

    r = client.post("/api/notifications/read-all", headers=h)
    assert r.status_code == 200 and r.json()["marked"] >= 1
    assert client.get("/api/notifications", headers=h).json()["unread_count"] == 0


def test_mark_read_404(client, auth):
    assert client.post("/api/notifications/999999/read", headers=auth("owner")).status_code == 404
