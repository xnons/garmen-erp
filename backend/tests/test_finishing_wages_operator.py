"""Regresi: operator upah borongan tidak boleh 'nyasar' ke akun yang login.

Bug asal: baris upah dengan operator_id kosong / karyawan terhapus tampil
memakai nama user yang sedang membuka halaman (mis. akun DEVELOPER), dan
POST tanpa operator_id diam-diam tersimpan atas nama si pembuat.
"""
from datetime import date

import models


def _mk_worker(db, kid="WRK-100", nama="Johan Steam", role="PRODUKSI"):
    db.add(models.Karyawan(
        id_karyawan=kid, nama=nama, username=kid.lower(),
        hashed_password="x", role=role, is_active=True, can_login=False,
        jabatan="Operator Finishing", status_karyawan="TETAP",
        tipe_pay="BORONGAN", tarif_borongan_pcs=550,
    ))
    db.commit()
    return kid


def _mk_wage(db, so_id, operator_id, op="STIM"):
    w = models.PieceRateWage(
        so_id=so_id, operator_id=operator_id, operation_type=op,
        work_date=date(2026, 8, 31), qty_completed=495, qty_reject=0,
        wage_per_piece=550, total_wage=272_250, size_breakdown={},
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return str(w.id)


# ---------------------------------------------------------------------------
# GET /api/shipping/wages — nama operator TIDAK bergantung pada siapa yang login
# ---------------------------------------------------------------------------
def test_null_operator_shows_none_not_viewer_name(client, auth, db, make_so):
    so_id = make_so()
    _mk_wage(db, so_id, operator_id=None)

    as_dev = client.get("/api/shipping/wages", headers=auth("developer")).json()
    as_owner = client.get("/api/shipping/wages", headers=auth("owner")).json()

    assert as_dev[0]["operator_name"] is None
    assert as_owner[0]["operator_name"] is None  # dulu -> "Owner"


def test_orphan_operator_shows_sentinel(client, auth, db, make_so):
    so_id = make_so()
    _mk_wage(db, so_id, operator_id="GHOST-999")  # tidak ada di master karyawan

    row = client.get("/api/shipping/wages", headers=auth("developer")).json()[0]
    assert row["operator_name"] == "(pekerja tidak terdaftar)"


def test_valid_operator_name_is_stable(client, auth, db, make_so):
    so_id = make_so()
    _mk_worker(db)
    _mk_wage(db, so_id, operator_id="WRK-100")

    row = client.get("/api/shipping/wages", headers=auth("owner")).json()[0]
    assert row["operator_name"] == "Johan Steam"


# ---------------------------------------------------------------------------
# POST /api/shipping/wages — operator wajib & harus karyawan nyata
# ---------------------------------------------------------------------------
def _payload(so_id, **over):
    base = dict(
        so_id=so_id, operation_type="STIM", work_date="2026-08-31",
        qty_completed=495, qty_reject=0, wage_per_piece=550,
    )
    base.update(over)
    return base


def test_post_without_operator_is_rejected(client, auth, db, make_so):
    so_id = make_so()
    r = client.post("/api/shipping/wages", json=_payload(so_id), headers=auth("developer"))
    assert r.status_code == 422, r.text
    # dan tidak ada baris yang tersimpan atas nama siapa pun
    assert client.get("/api/shipping/wages", headers=auth("developer")).json() == []


def test_post_with_unknown_operator_is_rejected(client, auth, db, make_so):
    so_id = make_so()
    r = client.post("/api/shipping/wages", json=_payload(so_id, operator_id="NOPE-1"),
                    headers=auth("developer"))
    assert r.status_code == 422, r.text


def test_post_with_privileged_operator_is_rejected(client, auth, db, users, make_so):
    """Inti bug: id_karyawan akun DEVELOPER dikirim eksplisit -> tetap ditolak."""
    so_id = make_so()
    dev_id = users["DEVELOPER"][0]  # "DEV-001"
    r = client.post("/api/shipping/wages", json=_payload(so_id, operator_id=dev_id),
                    headers=auth("developer"))
    assert r.status_code == 422, r.text
    assert "sistem" in r.json()["detail"].lower() or "manajerial" in r.json()["detail"].lower()


def test_post_with_inactive_operator_is_rejected(client, auth, db, make_so):
    so_id = make_so()
    db.add(models.Karyawan(
        id_karyawan="WRK-OFF", nama="Mantan Pekerja", username="wrk-off",
        hashed_password="x", role="PRODUKSI", is_active=False,
        tipe_pay="BORONGAN",
    ))
    db.commit()
    r = client.post("/api/shipping/wages", json=_payload(so_id, operator_id="WRK-OFF"),
                    headers=auth("developer"))
    assert r.status_code == 422, r.text


def test_post_wages_forbidden_for_non_writer_role(client, auth, db, make_so):
    so_id = make_so()
    _mk_worker(db)
    r = client.post("/api/shipping/wages", json=_payload(so_id, operator_id="WRK-100"),
                    headers=auth("gudang"))
    assert r.status_code == 403, r.text


def test_post_wages_rejects_zero_qty(client, auth, db, make_so):
    so_id = make_so()
    _mk_worker(db)
    r = client.post("/api/shipping/wages",
                    json=_payload(so_id, operator_id="WRK-100", qty_completed=0),
                    headers=auth("developer"))
    assert r.status_code == 422, r.text


def test_post_wages_rejects_negative_wage(client, auth, db, make_so):
    so_id = make_so()
    _mk_worker(db)
    r = client.post("/api/shipping/wages",
                    json=_payload(so_id, operator_id="WRK-100", wage_per_piece=-5),
                    headers=auth("developer"))
    assert r.status_code == 422, r.text


def test_post_with_valid_operator_succeeds(client, auth, db, make_so):
    so_id = make_so()
    _mk_worker(db)
    r = client.post("/api/shipping/wages", json=_payload(so_id, operator_id="WRK-100"),
                    headers=auth("produksi"))
    assert r.status_code == 201, r.text
    assert r.json()["operator_name"] == "Johan Steam"
    assert r.json()["total_wage"] == 495 * 550


# ---------------------------------------------------------------------------
# /api/karyawan/list — akun sistem tidak muncul sebagai "pekerja"
# ---------------------------------------------------------------------------
def test_worker_picker_excludes_system_accounts(client, auth, db, users):
    _mk_worker(db, kid="WRK-200", nama="Desti Packing")
    rows = client.get("/api/karyawan/list", headers=auth("developer")).json()
    ids = {r["id_karyawan"] for r in rows}
    # akun sistem dari fixture `users` (DEV-001/OWN-001/ADM-001/FIN-001) tidak muncul
    assert {"DEV-001", "OWN-001", "ADM-001", "FIN-001"}.isdisjoint(ids)
    # pekerja produksi + PPIC/GUDANG tetap muncul
    assert "WRK-200" in ids
    assert "PRD-001" in ids
    # payload ramping: tidak membocorkan username / role
    assert "username" not in rows[0] and "role" not in rows[0]


# ---------------------------------------------------------------------------
# POST /api/cutting/prep-tasks — tugas persiapan (upah) juga wajib operator
# ---------------------------------------------------------------------------
def test_prep_task_without_operator_is_rejected(client, auth, db, make_so):
    so_id = make_so()
    r = client.post("/api/cutting/prep-tasks", json=dict(
        so_id=so_id, task_type="NUMBERING", task_date="2026-08-31", qty_done=100,
    ), headers=auth("developer"))
    assert r.status_code == 422, r.text


# ---------------------------------------------------------------------------
# Payroll: baris upah nyasar ke akun DEVELOPER tidak muncul di rekap gaji
# ---------------------------------------------------------------------------
def test_cannot_hard_delete_worker_with_wage_history(client, auth, db, make_so):
    so_id = make_so()
    _mk_worker(db, kid="WRK-DEL", nama="Punya Riwayat")
    _mk_wage(db, so_id, operator_id="WRK-DEL")
    r = client.delete("/api/karyawan/WRK-DEL", headers=auth("developer"))
    assert r.status_code == 409, r.text
    assert "riwayat" in r.json()["detail"].lower()
    # akun masih ada
    assert db.query(models.Karyawan).filter(models.Karyawan.id_karyawan == "WRK-DEL").first() is not None


def test_can_hard_delete_worker_without_refs(client, auth, db):
    _mk_worker(db, kid="WRK-FREE", nama="Tanpa Riwayat")
    r = client.delete("/api/karyawan/WRK-FREE", headers=auth("developer"))
    assert r.status_code == 200, r.text


def test_payroll_summary_excludes_system_accounts(client, auth, db, users, make_so):
    so_id = make_so()
    dev_id = users["DEVELOPER"][0]
    _mk_wage(db, so_id, operator_id=dev_id)  # baris buruk yang sudah terlanjur ada

    body = client.get("/api/payroll/summary", params={"periode": "2026-08"},
                      headers=auth("finance")).json()
    ids = {row["id_karyawan"] for row in body["detail_karyawan"]}
    assert dev_id not in ids  # akun DEVELOPER tidak pernah muncul di rekap gaji
    # dan upah nyasar Rp 272.250 tidak nyangkut di baris siapa pun
    assert all(row["total_gaji"] != 272_250 for row in body["detail_karyawan"])
