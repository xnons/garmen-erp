"""Regresi Fase 1B: redaksi error, CORS allowlist, konfigurasi secret."""


def test_error_handler_redacts_and_returns_error_id(client_raw, auth, monkeypatch):
    """500 -> pesan generik + error_id, tanpa membocorkan str(exc) di 'detail'."""
    import routers.dashboard as dash

    def _boom():
        raise RuntimeError("LEAK_SECRET_STRING")

    monkeypatch.setattr(
        dash, "date",
        type("D", (), {"today": staticmethod(_boom)}),
        raising=True,
    )
    r = client_raw.get("/api/dashboard/overview-stats", headers=auth("developer"))
    assert r.status_code == 500
    body = r.json()
    assert body.get("error_id")
    assert "LEAK_SECRET_STRING" not in body.get("detail", "")
    # DEV_MODE=true di test => detail teknis boleh muncul di field terpisah 'debug'
    assert "LEAK_SECRET_STRING" in body.get("debug", "")


def test_cors_rejects_unlisted_origin(client, users):
    r = client.get(
        "/api/auth/login",
        headers={"Origin": "https://evil.example.com"},
    )
    # Origin tak terdaftar -> tidak ada header ACAO yang meng-echo origin jahat
    acao = r.headers.get("access-control-allow-origin")
    assert acao != "https://evil.example.com"


def test_cors_allows_listed_origin_preflight(client, users):
    r = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://testserver",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.headers.get("access-control-allow-origin") == "http://testserver"


def test_secret_key_is_not_the_old_public_default():
    import core.security as sec
    assert sec.SECRET_KEY
    assert "REPLACE_ME" not in sec.SECRET_KEY
    assert sec.SECRET_KEY != "NEXORA_ENTERPRISE_SECRET_KEY_PROD_REPLACE_ME"


def test_root_health_ok(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "Online"
