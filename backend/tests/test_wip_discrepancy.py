"""
WIP subcon: rumus selisih  Kirim - (Terima + Rijek) = Selisih  dan status.
"""
from datetime import date

DISPATCH = "/api/wip/dispatch"


def _dispatch(client, headers, so_id, qty=100, stage="SEWING_MAKLUN"):
    return client.post(DISPATCH, json={
        "so_id": so_id,
        "stage_name": stage,
        "sequence_order": 3,
        "surat_jalan_no": "SJ-T-1",
        "dispatch_date": date(2026, 3, 1).isoformat(),
        "qty_dispatched": qty,
    }, headers=headers)


def test_dispatch_then_receive_exact_is_completed(client, auth, make_so):
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    r = client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 100, "qty_reject": 0,
    }, headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["balance_discrepancy"] == 0
    assert body["status"] == "COMPLETED"


def test_receive_with_reject_balances(client, auth, make_so):
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    r = client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 95, "qty_reject": 5,
    }, headers=h)
    assert r.status_code == 200
    assert r.json()["balance_discrepancy"] == 0        # 100 - (95 + 5)
    assert r.json()["status"] == "COMPLETED"


def test_missing_goods_produce_positive_discrepancy(client, auth, make_so):
    """Kirim 100, terima 96, rijek 0 -> selisih 4 pcs hilang."""
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    r = client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 96, "qty_reject": 0,
    }, headers=h)
    assert r.status_code == 200
    assert r.json()["balance_discrepancy"] == 4        # nilai inti yang dipakai AI/alert/dashboard


def test_missing_goods_flag_status(client, auth, make_so):
    """Selisih > 0 tanpa is_partial -> DISCREPANCY_FLAG (barang hilang, perlu klarifikasi)."""
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    r = client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 96, "qty_reject": 0,
    }, headers=h)
    assert r.status_code == 200
    assert r.json()["balance_discrepancy"] == 4
    assert r.json()["status"] == "DISCREPANCY_FLAG"


def test_explicit_partial_receipt_not_flagged(client, auth, make_so):
    """is_partial=True -> PARTIAL_RECEIVED, tidak memicu alarm selisih."""
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    r = client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 60, "qty_reject": 0, "is_partial": True,
    }, headers=h)
    assert r.status_code == 200
    assert r.json()["balance_discrepancy"] == 40
    assert r.json()["status"] == "PARTIAL_RECEIVED"


def test_over_receipt_is_flagged(client, auth, make_so):
    """Terima > Kirim juga anomali -> DISCREPANCY_FLAG."""
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    r = client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 105, "qty_reject": 0,
    }, headers=h)
    assert r.status_code == 200
    assert r.json()["balance_discrepancy"] == -5
    assert r.json()["status"] == "DISCREPANCY_FLAG"


def test_reject_creates_reject_log(client, auth, make_so, db):
    import models
    so = make_so()
    h = auth("developer")
    mv = _dispatch(client, h, so, qty=100).json()
    client.put(f"/api/wip/movements/{mv['id']}/receive", json={
        "received_date": date(2026, 3, 10).isoformat(),
        "qty_received": 90, "qty_reject": 10, "defect_reason": "BELANG WARNA",
    }, headers=h)
    logs = db.query(models.RejectLog).filter_by(so_id=so).all()
    assert len(logs) == 1
    assert logs[0].qty_reject == 10
    assert logs[0].total_loss == 10 * 15000.0
