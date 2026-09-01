"""
Gudang kain: rumus 4-Point ASTM + penentuan grade.
  Summary Point = (total_defect_points * 3600) / (width_inch * length_after_yard)
  <= 20 -> GRADE_A/PASSED ; <= 30 -> GRADE_B/PASSED ; > 30 -> GRADE_C/REJECTED
"""
from datetime import date


def _item(client, h, code="MG-T-0001"):
    r = client.post("/api/warehouse/items", json={
        "item_code": code, "description": "Denim Test", "item_type": "FABRIC_MAIN",
        "unit": "YARD", "width_inch": 58.0,
    }, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _receipt(client, h, item_id, qty=1000.0):
    r = client.post("/api/warehouse/receipts", json={
        "item_id": item_id, "receipt_date": date(2026, 1, 5).isoformat(),
        "roll_number": "ROLL-1", "qty_received": qty,
    }, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _inspect(client, h, receipt_id, points, width=60.0, length=100.0):
    return client.post("/api/warehouse/inspections", json={
        "receipt_id": receipt_id,
        "inspection_date": date(2026, 1, 6).isoformat(),
        "length_before": length, "length_after": length,
        "width_inch": width, "total_defect_points": points,
    }, headers=h)


def test_grade_a_low_defects(client, auth):
    h = auth("gudang")
    rid = _receipt(client, h, _item(client, h))
    # (10 * 3600) / (60 * 100) = 6.0  -> GRADE_A
    r = _inspect(client, h, rid, points=10)
    assert r.status_code == 201, r.text
    assert r.json()["summary_point"] == 6.0
    assert r.json()["grade"] == "GRADE_A"


def test_grade_b_boundary(client, auth):
    h = auth("gudang")
    rid = _receipt(client, h, _item(client, h, "MG-T-0002"))
    # target summary 25 -> points = 25 * 60 * 100 / 3600 = 41.67 -> 42 -> 42*3600/6000 = 25.2 (<=30) GRADE_B
    r = _inspect(client, h, rid, points=42)
    assert r.status_code == 201
    assert r.json()["grade"] == "GRADE_B"


def test_grade_c_rejected_and_marks_receipt(client, auth, db):
    import models
    h = auth("gudang")
    item = _item(client, h, "MG-T-0003")
    rid = _receipt(client, h, item)
    # points 60 -> (60*3600)/(60*100) = 36.0 > 30 -> GRADE_C / REJECTED
    r = _inspect(client, h, rid, points=60)
    assert r.status_code == 201
    assert r.json()["grade"] == "GRADE_C"
    receipt = db.query(models.MaterialReceipt).filter_by(id=rid).first()
    assert receipt.inspection_status == "REJECTED"


def test_inspection_rejects_zero_width(client, auth):
    h = auth("gudang")
    rid = _receipt(client, h, _item(client, h, "MG-T-0004"))
    r = _inspect(client, h, rid, points=5, width=0.0)
    assert r.status_code == 400


def test_inspection_unknown_receipt_404(client, auth):
    r = client.post("/api/warehouse/inspections", json={
        "receipt_id": "does-not-exist",
        "inspection_date": date(2026, 1, 6).isoformat(),
        "length_before": 100.0, "length_after": 100.0,
        "width_inch": 60.0, "total_defect_points": 3,
    }, headers=auth("gudang"))
    assert r.status_code == 404
