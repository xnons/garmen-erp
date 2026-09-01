"""Validasi payload upah borongan:
  * operation_type / task_type dibatasi ke daftar tetap (Enum) -> tolak yang ngawur;
  * tanggal di periode payroll yang sudah dicairkan ditutup untuk entri & koreksi.
"""
import models


def _mk_worker(db, kid="WRK-VAL", nama="Tukang Uji"):
    db.add(models.Karyawan(
        id_karyawan=kid, nama=nama, username=kid.lower(), hashed_password="x",
        role="PRODUKSI", is_active=True, can_login=False,
        tipe_pay="BORONGAN", tarif_borongan_pcs=550,
    ))
    db.commit()
    return kid


def _wage_payload(so_id, **over):
    base = dict(
        so_id=so_id, operator_id="WRK-VAL", operation_type="STIM",
        work_date="2026-08-10", qty_completed=100, qty_reject=0, wage_per_piece=550,
    )
    base.update(over)
    return base


# --- Enum operation_type -----------------------------------------------------
def test_wage_rejects_unknown_operation_type(client, auth, db, make_so):
    _mk_worker(db)
    so_id = make_so()
    r = client.post("/api/shipping/wages",
                    json=_wage_payload(so_id, operation_type="MENARI_HUJAN"),
                    headers=auth("produksi"))
    assert r.status_code == 422, r.text


def test_wage_accepts_lowercase_operation_type(client, auth, db, make_so):
    _mk_worker(db)
    so_id = make_so()
    r = client.post("/api/shipping/wages",
                    json=_wage_payload(so_id, operation_type="packing"),
                    headers=auth("produksi"))
    assert r.status_code == 201, r.text
    assert r.json()["operation_type"] == "PACKING"


def test_prep_task_rejects_unknown_task_type(client, auth, db, make_so):
    _mk_worker(db)
    so_id = make_so()
    r = client.post("/api/cutting/prep-tasks", json=dict(
        so_id=so_id, operator_id="WRK-VAL", task_type="GORENG_KERUPUK",
        task_date="2026-08-10", qty_done=50,
    ), headers=auth("produksi"))
    assert r.status_code == 422, r.text


# --- Periode payroll yang sudah dicairkan ----------------------------------
def _settle(client, auth, periode="2026-08"):
    r = client.post("/api/payroll/mark-paid", json={"periode_gaji": periode},
                    headers=auth("finance"))
    assert r.status_code == 200, r.text


def test_wage_create_blocked_for_settled_period(client, auth, db, make_so):
    _mk_worker(db)
    so_id = make_so()
    # satu entri sah dulu, lalu cairkan Agustus
    assert client.post("/api/shipping/wages", json=_wage_payload(so_id),
                       headers=auth("produksi")).status_code == 201
    _settle(client, auth)

    r = client.post("/api/shipping/wages",
                    json=_wage_payload(so_id, work_date="2026-08-25"),
                    headers=auth("produksi"))
    assert r.status_code == 409, r.text
    assert "dicairkan" in r.json()["detail"].lower()


def test_settled_wage_row_cannot_be_edited_or_deleted(client, auth, db, make_so):
    _mk_worker(db)
    so_id = make_so()
    wid = client.post("/api/shipping/wages", json=_wage_payload(so_id),
                      headers=auth("produksi")).json()["id"]
    _settle(client, auth)

    r_put = client.put(f"/api/shipping/wages/{wid}", json={"qty_completed": 5},
                       headers=auth("developer"))
    assert r_put.status_code == 409, r_put.text

    r_del = client.delete(f"/api/shipping/wages/{wid}", headers=auth("developer"))
    assert r_del.status_code == 409, r_del.text


def test_wage_create_still_ok_for_open_period(client, auth, db, make_so):
    _mk_worker(db)
    so_id = make_so()
    client.post("/api/shipping/wages", json=_wage_payload(so_id),
                headers=auth("produksi"))
    _settle(client, auth, "2026-08")

    # September masih terbuka
    r = client.post("/api/shipping/wages",
                    json=_wage_payload(so_id, work_date="2026-09-02"),
                    headers=auth("produksi"))
    assert r.status_code == 201, r.text
