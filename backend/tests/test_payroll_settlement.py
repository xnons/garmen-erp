"""Payroll: settlement lifecycle upah borongan blueprint (is_paid / mark-paid)."""
from datetime import date

import models


def _worker(db, kid="KRY-BOR-1", nama="Tukang Borong", tarif=550):
    db.add(models.Karyawan(
        id_karyawan=kid, nama=nama, username=kid.lower(), hashed_password="x",
        role="FINISHING_OPERATOR", is_active=True, can_login=False,
        tipe_pay="BORONGAN", tarif_borongan_pcs=tarif, gaji_pokok=0,
    ))
    db.commit()
    return kid


def _so(db, so_number="SO-PAY-1"):
    so = models.SalesOrder(so_number=so_number, style_name="X", item_category="LONG JEANS",
                           order_qty=1000, status="FINISHING",
                           order_date=date(2026, 7, 1), deadline=date(2026, 9, 1))
    db.add(so)
    db.commit()
    db.refresh(so)
    return so.id


def _wage(db, so_id, operator_id, d, qty=100, rate=550):
    w = models.PieceRateWage(so_id=so_id, operator_id=operator_id, operation_type="STIM",
                             work_date=d, qty_completed=qty, qty_reject=0,
                             wage_per_piece=rate, total_wage=qty * rate, size_breakdown={})
    db.add(w); db.commit(); db.refresh(w)
    return w.id


def _summary(client, auth, periode="2026-08"):
    r = client.get("/api/payroll/summary", params={"periode": periode}, headers=auth("finance"))
    assert r.status_code == 200, r.text
    return r.json()


def _row(summary, kid):
    return next((x for x in summary["detail_karyawan"] if x["id_karyawan"] == kid), None)


def test_mark_paid_flags_blueprint_wage_rows(client, auth, db):
    kid = _worker(db)
    so_id = _so(db)
    wid = _wage(db, so_id, kid, date(2026, 8, 10))

    # sebelum: outstanding
    assert _row(_summary(client, auth), kid)["total_gaji"] == 100 * 550

    r = client.post("/api/payroll/mark-paid", json={"periode_gaji": "2026-08"}, headers=auth("finance"))
    assert r.status_code == 200, r.text

    db.expire_all()
    w = db.query(models.PieceRateWage).get(wid)
    assert w.is_paid is True
    assert w.payroll_batch_id == "PAY-2026-08"
    assert w.paid_at is not None


def test_summary_shows_outstanding_zero_after_settlement(client, auth, db):
    kid = _worker(db, kid="KRY-BOR-2")
    so_id = _so(db, "SO-PAY-2")
    _wage(db, so_id, kid, date(2026, 8, 12))

    client.post("/api/payroll/mark-paid", json={"periode_gaji": "2026-08"}, headers=auth("finance"))

    summary = _summary(client, auth)
    row = _row(summary, kid)
    assert row["total_gaji"] == 0                        # tak ada lagi yang terutang
    assert row["borongan_sudah_dibayar"] == 100 * 550    # tercatat sudah dibayar
    assert summary["total_borongan_sudah_dibayar"] == 100 * 550   # rollup untuk kartu ringkasan


def test_mark_paid_is_idempotent(client, auth, db):
    kid = _worker(db, kid="KRY-BOR-3")
    so_id = _so(db, "SO-PAY-3")
    _wage(db, so_id, kid, date(2026, 8, 15))

    a = client.post("/api/payroll/mark-paid", json={"periode_gaji": "2026-08"}, headers=auth("finance"))
    b = client.post("/api/payroll/mark-paid", json={"periode_gaji": "2026-08"}, headers=auth("finance"))
    assert a.status_code == 200 and b.status_code == 200

    n_logs = db.query(models.LogPayrollProduksi).filter(
        models.LogPayrollProduksi.karyawan_id == kid).count()
    assert n_logs == 1                                   # merge by deterministic id, bukan dobel


def test_payroll_summary_keeps_monthly_support_staff(client, auth, users):
    """PPIC / QC_INSPECTOR / GUDANG bukan buruh borongan (tak muncul di picker,
    tak bisa jadi operator upah) TAPI gaji bulanan mereka tetap di rekap payroll.
    Akun sistem (DEVELOPER/OWNER/ADMIN/FINANCE) tetap tidak muncul."""
    ids = {r["id_karyawan"] for r in _summary(client, auth)["detail_karyawan"]}
    assert {"PPC-001", "GDG-001"} <= ids            # staf bulanan tetap ada
    assert {"DEV-001", "OWN-001", "ADM-001", "FIN-001"}.isdisjoint(ids)


def test_new_wage_after_settlement_is_outstanding_again(client, auth, db):
    kid = _worker(db, kid="KRY-BOR-4")
    so_id = _so(db, "SO-PAY-4")
    _wage(db, so_id, kid, date(2026, 8, 3))
    client.post("/api/payroll/mark-paid", json={"periode_gaji": "2026-08"}, headers=auth("finance"))
    assert _row(_summary(client, auth), kid)["total_gaji"] == 0

    _wage(db, so_id, kid, date(2026, 8, 25), qty=40)     # setoran baru, periode sama
    assert _row(_summary(client, auth), kid)["total_gaji"] == 40 * 550
