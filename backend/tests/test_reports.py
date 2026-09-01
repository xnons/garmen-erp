"""Laporan agregat: /api/reports/* dan /api/dashboard/kpi-ribbon."""
from datetime import date


def _seed_pipeline(db):
    """SO + cutting + wip movement + shipment + wages untuk bahan laporan."""
    import models
    so = models.SalesOrder(
        so_number="SO-RPT-1", style_name="RPT STYLE", item_category="LONG JEANS",
        order_qty=100, unit_price=40000, total_order_value=4_000_000,
        status="SHIPPED", order_date=date(2026, 1, 1), deadline=date(2026, 2, 1),
    )
    db.add(so)
    db.flush()

    db.add(models.CuttingRecord(
        so_id=so.id, cutting_date=date(2026, 1, 5), qty_cut=100,
        main_fabric_used=130.0, fabric_waste_yards=6.5, size_breakdown_cut={},
    ))
    db.add(models.WIPMovement(
        so_id=so.id, stage_name="SEWING_MAKLUN", sequence_order=3,
        dispatch_date=date(2026, 1, 6), qty_dispatched=100,
        received_date=date(2026, 1, 20), qty_received=96, qty_reject=0,
        balance_discrepancy=4, status="DISCREPANCY_FLAG",
    ))
    db.add(models.Shipment(
        so_id=so.id, shipment_date=date(2026, 1, 25), surat_jalan_no="SJP-RPT-1",
        total_qty_shipped=96, total_invoice_amount=3_840_000, size_breakdown_shipped={},
    ))
    db.add(models.PieceRateWage(
        so_id=so.id, operation_type="PACKING", work_date=date(2026, 1, 24),
        qty_completed=96, wage_per_piece=600, total_wage=57_600, size_breakdown={},
    ))
    db.add(models.RejectLog(
        so_id=so.id, stage_name="SEWING_DEFECT", defect_reason="BELANG",
        qty_reject=4, unit_cost_loss=15000.0, total_loss=60_000.0,
    ))
    db.commit()
    return so.id


RANGE = {"start": "2026-01-01", "end": "2026-03-31"}


def test_production_summary_shape(client, auth, db):
    _seed_pipeline(db)
    r = client.get("/api/reports/production-summary", params=RANGE, headers=auth("produksi"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert {"range", "by_stage", "cutting_yield", "delivery", "wip_aging"} <= body.keys()
    stage = next(s for s in body["by_stage"] if s["stage"] == "SEWING_MAKLUN")
    assert stage["dispatched"] == 100 and stage["received"] == 96
    cy = body["cutting_yield"]
    assert cy["qty_cut"] == 100
    assert cy["consumption_per_pcs"] == 1.3
    assert cy["waste_pct"] == 5.0
    assert body["delivery"]["on_time"] == 1  # shipped 2026-01-25 <= deadline 2026-02-01


def test_production_summary_needs_auth(client, users):
    assert client.get("/api/reports/production-summary").status_code == 401


def test_financial_summary_finance_only(client, auth, db):
    _seed_pipeline(db)
    assert client.get("/api/reports/financial-summary", headers=auth("produksi")).status_code == 403
    r = client.get("/api/reports/financial-summary", params=RANGE, headers=auth("finance"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["invoice_total"] == 3_840_000
    assert body["wage_piece_rate"] == 57_600
    assert body["reject_loss"] == 60_000
    assert body["shipped_qty"] == 96
    assert any(s["so_number"] == "SO-RPT-1" for s in body["per_sales_order"])


def test_vendor_scorecard(client, auth, db):
    import models
    p = models.Partner(code="MKL-X", name="Maklun X", category="MAKLUN_SEWING")
    db.add(p)
    db.flush()
    so = models.SalesOrder(so_number="SO-V1", style_name="S", order_qty=50,
                           status="WIP_SUBCON", order_date=date(2026, 1, 1))
    db.add(so)
    db.flush()
    db.add(models.WIPMovement(
        so_id=so.id, stage_name="SEWING_MAKLUN", sequence_order=3, partner_id=p.id,
        dispatch_date=date(2026, 1, 2), qty_dispatched=50,
        qty_received=45, qty_reject=2, balance_discrepancy=3, status="DISCREPANCY_FLAG",
    ))
    db.commit()

    r = client.get("/api/reports/vendor-scorecard", headers=auth("ppic"))
    assert r.status_code == 200, r.text
    v = next(x for x in r.json()["vendors"] if x["partner_name"] == "Maklun X")
    assert v["dispatched"] == 50 and v["reject"] == 2 and v["discrepancy"] == 3
    assert v["risk"] == "TINGGI"
    assert 0 <= v["score"] <= 100


def test_kpi_ribbon(client, auth, db):
    import models
    db.add(models.SalesOrder(so_number="SO-K1", style_name="A", order_qty=10,
                             status="CUTTING", order_date=date(2026, 1, 1),
                             deadline=date.today()))  # deadline hari ini -> within 7 days
    db.add(models.InventoryItem(item_code="LOW-1", description="Kain tipis",
                                item_type="FABRIC_MAIN", current_stock=5.0, min_stock_alert=50.0))
    db.commit()
    r = client.get("/api/dashboard/kpi-ribbon", headers=auth("produksi"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["soActive"] >= 1
    assert body["deadlinesWithin7Days"] >= 1
    assert body["lowStockItems"] >= 1
    assert set(body.keys()) == {
        "soActive", "deadlinesWithin7Days", "wipInProcessPcs",
        "vendorDiscrepancyFlags", "lowStockItems",
    }
