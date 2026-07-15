import pytest


@pytest.mark.asyncio
async def test_reporte_gastos_comunes_csv(client, admin_user, auth_headers):
    await client.post("/api/v1/unidades", json={"numero": "101", "metraje": 50}, headers=auth_headers)
    creado = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    periodo_id = creado.json()["id"]

    response = await client.get(f"/api/v1/reportes/gastos-comunes/{periodo_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "101" in response.text
    assert "Pendiente" in response.text


@pytest.mark.asyncio
async def test_reporte_gastos_comunes_periodo_inexistente(client, admin_user, auth_headers):
    response = await client.get(
        "/api/v1/reportes/gastos-comunes/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_reporte_financiero_csv(client, admin_user, auth_headers):
    await client.post(
        "/api/v1/finanzas/movimientos",
        json={"tipo": "egreso", "categoria": "Mantención", "monto": 30000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )

    response = await client.get("/api/v1/reportes/financiero", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "Mantención" in response.text


@pytest.mark.asyncio
async def test_reportes_requiere_autenticacion(client):
    response = await client.get("/api/v1/reportes/financiero")
    assert response.status_code in (401, 403)
