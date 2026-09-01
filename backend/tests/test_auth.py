"""Auth: login, Login Time Guard, PIN verify/change, hierarki role saat register."""
import pytest


def test_login_success_returns_token_and_user(client, users):
    r = client.post("/api/auth/login", json={"username": "owner", "password": "pass12345"})
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"]
    assert body["user"]["role"] == "OWNER"
    assert body["user"]["username"] == "owner"


def test_login_wrong_password_401(client, users):
    r = client.post("/api/auth/login", json={"username": "owner", "password": "salah"})
    assert r.status_code == 401


def test_login_unknown_user_401(client, users):
    r = client.post("/api/auth/login", json={"username": "nobody", "password": "x"})
    assert r.status_code == 401


def test_inactive_account_blocked(client, users, db):
    import models
    u = db.query(models.Karyawan).filter_by(username="produksi").first()
    u.is_active = False
    db.commit()
    r = client.post("/api/auth/login", json={"username": "produksi", "password": "pass12345"})
    assert r.status_code == 403


def test_offline_worker_cannot_login(client, users, db):
    import models
    u = db.query(models.Karyawan).filter_by(username="produksi").first()
    u.can_login = False
    db.commit()
    r = client.post("/api/auth/login", json={"username": "produksi", "password": "pass12345"})
    assert r.status_code == 403


def test_login_time_guard_blocks_non_privileged_outside_hours(client, users, monkeypatch):
    # Batalkan bypass global: paksa "di luar jam kerja"
    monkeypatch.setattr("routers.auth.is_working_hours", lambda: False)
    # Non OWNER/DEVELOPER diblokir
    r = client.post("/api/auth/login", json={"username": "produksi", "password": "pass12345"})
    assert r.status_code == 403
    assert "operasional" in r.json()["detail"].lower()
    # OWNER & DEVELOPER tetap boleh
    assert client.post("/api/auth/login", json={"username": "owner", "password": "pass12345"}).status_code == 200
    assert client.post("/api/auth/login", json={"username": "developer", "password": "pass12345"}).status_code == 200


def test_me_requires_token(client, users):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_profile(client, auth):
    r = client.get("/api/auth/me", headers=auth("finance"))
    assert r.status_code == 200
    assert r.json()["role"] == "FINANCE"


def test_verify_pin_ok_and_wrong(client, auth):
    h = auth("produksi")
    assert client.post("/api/auth/verify-pin", json={"pin": "1234"}, headers=h).status_code == 200
    assert client.post("/api/auth/verify-pin", json={"pin": "9999"}, headers=h).status_code == 400


def test_change_pin_then_login_gate(client, auth):
    h = auth("produksi")
    r = client.post("/api/auth/change-pin", json={"old_pin": "1234", "new_pin": "4321"}, headers=h)
    assert r.status_code == 200
    assert client.post("/api/auth/verify-pin", json={"pin": "4321"}, headers=h).status_code == 200
    assert client.post("/api/auth/verify-pin", json={"pin": "1234"}, headers=h).status_code == 400


def test_change_pin_rejects_non_numeric(client, auth):
    r = client.post("/api/auth/change-pin", json={"old_pin": "1234", "new_pin": "abcd"}, headers=auth("produksi"))
    assert r.status_code == 400


# --- Hierarki role saat register ---

def test_admin_cannot_create_owner(client, auth):
    r = client.post("/api/auth/register",
                    json={"nama": "X", "username": "x_owner", "password": "pass12345", "role": "OWNER"},
                    headers=auth("admin"))
    assert r.status_code == 403


def test_admin_can_create_produksi(client, auth):
    r = client.post("/api/auth/register",
                    json={"nama": "X", "username": "x_prod", "password": "pass12345", "role": "PRODUKSI"},
                    headers=auth("admin"))
    assert r.status_code == 201


def test_produksi_cannot_register_anyone(client, auth):
    r = client.post("/api/auth/register",
                    json={"nama": "X", "username": "x_any", "password": "pass12345", "role": "PRODUKSI"},
                    headers=auth("produksi"))
    assert r.status_code == 403


def test_register_duplicate_username_400(client, auth):
    r = client.post("/api/auth/register",
                    json={"nama": "Dup", "username": "produksi", "password": "pass12345", "role": "PRODUKSI"},
                    headers=auth("developer"))
    assert r.status_code == 400
