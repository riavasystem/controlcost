import pytest


async def _crear_unidad(client, auth_headers):
    response = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    return response.json()["id"]


@pytest.mark.asyncio
async def test_crear_multa_genera_ingreso_en_finanzas(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)

    response = await client.post(
        "/api/v1/multas",
        json={"unidad_id": unidad_id, "motivo": "Ruidos molestos", "monto": 15000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["pagada"] is False
    assert body["unidad_numero"] == "101"

    resumen = await client.get("/api/v1/finanzas/resumen", headers=auth_headers)
    assert resumen.json()["total_ingresos_manuales"] == "15000.00"

    movimientos = await client.get("/api/v1/finanzas/movimientos", headers=auth_headers)
    categorias = [m["categoria"] for m in movimientos.json()]
    assert "Multas" in categorias


@pytest.mark.asyncio
async def test_no_permite_multa_con_unidad_inexistente(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/multas",
        json={
            "unidad_id": "00000000-0000-0000-0000-000000000000",
            "motivo": "Ruidos molestos",
            "monto": 15000,
            "fecha": "2026-07-05",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_marcar_multa_como_pagada(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/multas",
        json={"unidad_id": unidad_id, "motivo": "Estacionamiento indebido", "monto": 10000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )
    multa_id = creada.json()["id"]

    response = await client.patch(f"/api/v1/multas/{multa_id}", params={"pagada": True}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["pagada"] is True


@pytest.mark.asyncio
async def test_eliminar_multa_elimina_su_ingreso_en_finanzas(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/multas",
        json={"unidad_id": unidad_id, "motivo": "Ruidos molestos", "monto": 15000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )
    multa_id = creada.json()["id"]

    response = await client.delete(f"/api/v1/multas/{multa_id}", headers=auth_headers)
    assert response.status_code == 204

    listado = await client.get("/api/v1/multas", headers=auth_headers)
    assert listado.json() == []

    resumen = await client.get("/api/v1/finanzas/resumen", headers=auth_headers)
    assert resumen.json()["total_ingresos_manuales"] == "0.00"


@pytest.mark.asyncio
async def test_multas_requiere_autenticacion(client):
    response = await client.get("/api/v1/multas")
    assert response.status_code in (401, 403)
