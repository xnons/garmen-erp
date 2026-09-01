"""
Matriks RBAC: endpoint sensitif harus menolak role yang tidak berwenang (403)
dan tetap melayani role berwenang. Sekaligus regresi Fase 1C (endpoint yang
dulu tanpa proteksi) dan Fase 2A (unifikasi require_role/require_roles).
"""
import pytest

# (method, path, json_body, roles_allowed)
CASES = [
    ("GET", "/api/inventaris/", None, {"OWNER", "DEVELOPER", "ADMIN", "GUDANG"}),
    ("GET", "/api/audit/login-logs", None, {"OWNER", "DEVELOPER"}),
    ("GET", "/api/audit/activity-logs", None, {"OWNER", "DEVELOPER"}),
    ("POST", "/api/ppic/partners", {"name": "Z", "category": "BUYER"},
     {"PPIC", "ADMIN", "OWNER", "DEVELOPER"}),
    ("GET", "/api/produksi/payroll/rekap-unpaid", None,
     {"OWNER", "DEVELOPER", "ADMIN", "FINANCE"}),
]

ALL_ROLES = ["developer", "owner", "admin", "finance", "ppic", "produksi", "gudang"]
ROLE_OF = {
    "developer": "DEVELOPER", "owner": "OWNER", "admin": "ADMIN", "finance": "FINANCE",
    "ppic": "PPIC", "produksi": "PRODUKSI", "gudang": "GUDANG",
}


@pytest.mark.parametrize("method,path,body,allowed", CASES)
@pytest.mark.parametrize("username", ALL_ROLES)
def test_rbac_matrix(client, auth, method, path, body, allowed, username):
    resp = client.request(method, path, json=body, headers=auth(username))
    if ROLE_OF[username] in allowed:
        assert resp.status_code != 403, f"{username} seharusnya BOLEH {method} {path} -> {resp.status_code}"
    else:
        assert resp.status_code == 403, f"{username} seharusnya DITOLAK {method} {path} -> {resp.status_code}"


@pytest.mark.parametrize("path", [
    "/api/dashboard/chart-produksi",       # Fase 1C: dulu publik
    "/api/dashboard/chart-brand-material",  # Fase 1C: dulu publik
    "/api/dashboard/overview-stats",
    "/api/ai/test",                         # Fase 1C: dulu tanpa auth
    "/api/inventaris/",
    "/api/ppic/orders",
])
def test_endpoints_require_authentication(client, users, path):
    assert client.get(path).status_code == 401


def test_ai_test_endpoint_developer_only(client, auth):
    assert client.get("/api/ai/test", headers=auth("produksi")).status_code == 403
    assert client.get("/api/ai/test", headers=auth("developer")).status_code == 200


def test_reseed_pipeline_rejects_non_developer(client, auth):
    # Fase 1C: dulu semua user login bisa memicu reseed seluruh DB.
    assert client.post("/api/dashboard/reseed-production-pipeline", headers=auth("admin")).status_code == 403
    assert client.post("/api/dashboard/reseed-production-pipeline", headers=auth("produksi")).status_code == 403
    assert client.post("/api/dashboard/reseed-production-pipeline").status_code == 401
