import pytest


async def _crear_cargo(client, auth_headers):
    await client.post("/api/v1/unidades", json={"numero": "101", "metraje": 50}, headers=auth_headers)
    creado = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    return creado.json()["cargos"][0]["id"]


@pytest.mark.asyncio
async def test_registrar_pago_marca_cargo_como_pagado(client, admin_user, auth_headers):
    cargo_id = await _crear_cargo(client, auth_headers)

    response = await client.post(
        "/api/v1/pagos",
        json={"cargo_id": cargo_id, "monto": 50000, "metodo": "transferencia", "fecha_pago": "2026-07-05"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["reversado"] is False
    assert body["metodo"] == "transferencia"

    pendientes = await client.get("/api/v1/pagos/cargos-pendientes", headers=auth_headers)
    assert pendientes.json() == []


@pytest.mark.asyncio
async def test_no_permite_pagar_cargo_ya_pagado(client, admin_user, auth_headers):
    cargo_id = await _crear_cargo(client, auth_headers)
    payload = {"cargo_id": cargo_id, "monto": 50000, "metodo": "efectivo", "fecha_pago": "2026-07-05"}

    await client.post("/api/v1/pagos", json=payload, headers=auth_headers)
    response = await client.post("/api/v1/pagos", json=payload, headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_revertir_pago_libera_el_cargo(client, admin_user, auth_headers):
    cargo_id = await _crear_cargo(client, auth_headers)
    creado = await client.post(
        "/api/v1/pagos",
        json={"cargo_id": cargo_id, "monto": 50000, "metodo": "webpay", "fecha_pago": "2026-07-05"},
        headers=auth_headers,
    )
    pago_id = creado.json()["id"]

    response = await client.post(f"/api/v1/pagos/{pago_id}/revertir", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["reversado"] is True

    pendientes = await client.get("/api/v1/pagos/cargos-pendientes", headers=auth_headers)
    assert len(pendientes.json()) == 1

    # Se puede volver a registrar un pago para el mismo cargo tras revertir el anterior
    nuevo = await client.post(
        "/api/v1/pagos",
        json={"cargo_id": cargo_id, "monto": 50000, "metodo": "efectivo", "fecha_pago": "2026-07-10"},
        headers=auth_headers,
    )
    assert nuevo.status_code == 201


@pytest.mark.asyncio
async def test_no_revierte_pago_dos_veces(client, admin_user, auth_headers):
    cargo_id = await _crear_cargo(client, auth_headers)
    creado = await client.post(
        "/api/v1/pagos",
        json={"cargo_id": cargo_id, "monto": 50000, "metodo": "efectivo", "fecha_pago": "2026-07-05"},
        headers=auth_headers,
    )
    pago_id = creado.json()["id"]

    await client.post(f"/api/v1/pagos/{pago_id}/revertir", headers=auth_headers)
    response = await client.post(f"/api/v1/pagos/{pago_id}/revertir", headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_pagos_requiere_autenticacion(client):
    response = await client.get("/api/v1/pagos")
    assert response.status_code in (401, 403)
