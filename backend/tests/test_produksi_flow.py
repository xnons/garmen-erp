"""
Alur produksi borongan end-to-end + regresi bug Fase 1D:
  input output -> hard-cap rantai -> QC anti-self-verify -> mark-paid -> LogPayrollProduksi
"""
from datetime import date

OUT = "/api/produksi/output"


def _post_output(client, headers, spk_id, tahapan, qty_pass, qty_disetor=None, karyawan_id="PRD-001"):
    body = {
        "tanggal": date(2026, 2, 1).isoformat(),
        "karyawan_id": karyawan_id,
        "spk_id": spk_id,
        "tahapan_proses": tahapan,
        "qty_disetor": qty_disetor if qty_disetor is not None else qty_pass,
        "qty_pass": qty_pass,
    }
    return client.post(OUT, json=body, headers=headers)


def test_record_output_happy_path(client, auth, make_spk):
    spk = make_spk(target_qty=100)
    r = _post_output(client, auth("developer"), spk, "CUTTING", 40)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["qty_pass"] == 40
    assert body["subtotal_rp"] == 40 * 500        # snapshot tarif
    assert body["status_verifikasi"] == "PENDING"


def test_output_math_validation(client, auth, make_spk):
    spk = make_spk(target_qty=100)
    # pass + defect != disetor
    r = _post_output(client, auth("developer"), spk, "CUTTING", qty_pass=30, qty_disetor=40)
    assert r.status_code == 400


def test_output_requires_produksi_role_worker(client, auth, make_spk):
    spk = make_spk(target_qty=100)
    r = _post_output(client, auth("developer"), spk, "CUTTING", 10, karyawan_id="ADM-001")
    assert r.status_code == 400
    assert "Divisi Produksi" in r.json()["detail"]


def test_output_rejected_on_draft_spk(client, auth, make_spk):
    spk = make_spk(target_qty=100, status="DRAFT")
    r = _post_output(client, auth("developer"), spk, "CUTTING", 10)
    assert r.status_code == 400


def test_cutting_hard_cap_enforced(client, auth, make_spk):
    spk = make_spk(target_qty=100)
    h = auth("developer")
    assert _post_output(client, h, spk, "CUTTING", 60).status_code == 201
    r = _post_output(client, h, spk, "CUTTING", 50)      # 60 + 50 > 100
    assert r.status_code == 400
    assert "Hard-Cap" in r.json()["detail"] or "Terlampaui" in r.json()["detail"]


def test_subprocess_cannot_exceed_approved_cutting(client, auth, make_spk):
    spk = make_spk(target_qty=100)
    dev = auth("developer")
    admin = auth("admin")
    # cutting 50 diinput lalu di-approve
    cut = _post_output(client, dev, spk, "CUTTING", 50).json()
    client.put(f"{OUT}/{cut['id']}/verifikasi",
               json={"status_verifikasi": "APPROVED"}, headers=admin)
    # SEWING 60 > 50 approved cutting -> ditolak
    r = _post_output(client, dev, spk, "SEWING", 60)
    assert r.status_code == 400


def test_qc_anti_self_verify(client, auth, make_spk):
    spk = make_spk(target_qty=100)
    admin = auth("admin")
    # admin yang input -> admin tidak boleh verifikasi punya sendiri
    log = _post_output(client, admin, spk, "CUTTING", 20).json()
    r = client.put(f"{OUT}/{log['id']}/verifikasi",
                   json={"status_verifikasi": "APPROVED"}, headers=admin)
    assert r.status_code == 403
    # tapi developer boleh
    r2 = client.put(f"{OUT}/{log['id']}/verifikasi",
                    json={"status_verifikasi": "APPROVED"}, headers=auth("developer"))
    assert r2.status_code == 200
    assert r2.json()["status_verifikasi"] == "APPROVED"


def test_mark_paid_writes_payroll_history_and_audit(client, auth, make_spk, db):
    """Regresi Fase 1D: mark_payroll_as_paid harus menulis LogPayrollProduksi + LogAudit."""
    import models
    spk = make_spk(target_qty=100)
    dev = auth("developer")
    admin = auth("admin")

    log = _post_output(client, dev, spk, "CUTTING", 40).json()
    client.put(f"{OUT}/{log['id']}/verifikasi",
               json={"status_verifikasi": "APPROVED"}, headers=admin)

    r = client.post("/api/produksi/payroll/mark-paid",
                    json={"karyawan_ids": ["PRD-001"], "payroll_id": "PAY-TEST-01"},
                    headers=auth("finance"))
    assert r.status_code == 200, r.text
    assert r.json()["total_transaksi_paid"] == 1

    pay = db.query(models.LogPayrollProduksi).filter_by(id="PAY-TEST-01-PRD-001").first()
    assert pay is not None
    assert pay.total_pcs_pass == 40
    assert pay.total_nominal_rp == 40 * 500

    audit = db.query(models.LogAudit).filter_by(aksi="PAYROLL_PAID", target_id="PAY-TEST-01").first()
    assert audit is not None

    # log sudah terkunci (is_paid) -> verifikasi ulang ditolak
    r2 = client.put(f"{OUT}/{log['id']}/verifikasi",
                    json={"status_verifikasi": "REJECTED"}, headers=admin)
    assert r2.status_code == 400


def test_bulk_verify_writes_audit_on_revision(client, auth, make_spk, db):
    """Regresi Fase 1D: bulk verify APPROVED->REJECTED harus tercatat di LogAuditVerifikasiQC."""
    import models
    spk = make_spk(target_qty=100)
    dev = auth("developer")
    admin = auth("admin")

    log = _post_output(client, dev, spk, "CUTTING", 10).json()
    # approve dulu (single)
    client.put(f"{OUT}/{log['id']}/verifikasi",
               json={"status_verifikasi": "APPROVED"}, headers=admin)
    # lalu bulk revisi ke REJECTED
    r = client.post(f"{OUT}/bulk-verifikasi",
                    json={"log_ids": [log["id"]], "status_verifikasi": "REJECTED",
                          "catatan": "salah hitung"},
                    headers=admin)
    assert r.status_code == 200

    rev = db.query(models.LogAuditVerifikasiQC).filter_by(log_output_id=log["id"]).all()
    assert any(x.status_lama == "APPROVED" and x.status_baru == "REJECTED" for x in rev)


def test_output_list_pagination_params(client, auth, make_spk):
    spk = make_spk(target_qty=1000)
    dev = auth("developer")
    for i in range(5):
        _post_output(client, dev, spk, "CUTTING", 10)
    r = client.get(f"{OUT}?limit=3&offset=0", headers=dev)
    assert r.status_code == 200
    assert len(r.json()) == 3
