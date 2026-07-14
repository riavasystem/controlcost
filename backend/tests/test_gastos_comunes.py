import pytest


async def _crear_unidad(client, auth_headers, numero="101", metraje=50):
    response = await client.post(
        "/api/v1/unidades",
        json={"numero": numero, "metraje": metraje},
        headers=auth_headers,
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_crear_periodo_genera_cargos_por_unidad(client, admin_user, auth_headers):
    await _crear_unidad(client, auth_headers, "101", 50)
    await _crear_unidad(client, auth_headers, "102", 80)

    response = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000, "extraordinario": 5000},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["total_unidades"] == 2
    assert len(body["cargos"]) == 2

    cargo_101 = next(c for c in body["cargos"] if c["unidad_numero"] == "101")
    assert cargo_101["monto_base"] == "50000.00"
    assert cargo_101["monto_total"] == "55000.00"
    assert cargo_101["pagado"] is False


@pytest.mark.asyncio
async def test_no_permite_periodo_duplicado(client, admin_user, auth_headers):
    await _crear_unidad(client, auth_headers)
    payload = {"anio": 2026, "mes": 7, "tarifa_m2": 1000}

    await client.post("/api/v1/gastos-comunes", json=payload, headers=auth_headers)
    response = await client.post("/api/v1/gastos-comunes", json=payload, headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_no_permite_periodo_sin_unidades(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_marcar_cargo_como_pagado(client, admin_user, auth_headers):
    await _crear_unidad(client, auth_headers)
    creado = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    periodo_id = creado.json()["id"]
    cargo_id = creado.json()["cargos"][0]["id"]

    response = await client.patch(
        f"/api/v1/gastos-comunes/{periodo_id}/cargos/{cargo_id}",
        params={"pagado": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["pagado"] is True

    listado = await client.get("/api/v1/gastos-comunes", headers=auth_headers)
    periodo = next(p for p in listado.json() if p["id"] == periodo_id)
    assert periodo["total_recaudado"] == "50000.00"
    assert periodo["total_pendiente"] == "0.00"


@pytest.mark.asyncio
async def test_no_elimina_periodo_con_cargos_pagados(client, admin_user, auth_headers):
    await _crear_unidad(client, auth_headers)
    creado = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    periodo_id = creado.json()["id"]
    cargo_id = creado.json()["cargos"][0]["id"]

    await client.patch(
        f"/api/v1/gastos-comunes/{periodo_id}/cargos/{cargo_id}",
        params={"pagado": True},
        headers=auth_headers,
    )

    response = await client.delete(f"/api/v1/gastos-comunes/{periodo_id}", headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_elimina_periodo_sin_pagos(client, admin_user, auth_headers):
    await _crear_unidad(client, auth_headers)
    creado = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    periodo_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/gastos-comunes/{periodo_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_gastos_comunes_requiere_autenticacion(client):
    response = await client.get("/api/v1/gastos-comunes")
    assert response.status_code in (401, 403)
