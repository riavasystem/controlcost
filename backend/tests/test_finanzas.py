import pytest


@pytest.mark.asyncio
async def test_crear_y_listar_movimiento(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/finanzas/movimientos",
        json={"tipo": "egreso", "categoria": "Mantención", "monto": 30000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["categoria"] == "Mantención"

    listado = await client.get("/api/v1/finanzas/movimientos", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_eliminar_movimiento(client, admin_user, auth_headers):
    creado = await client.post(
        "/api/v1/finanzas/movimientos",
        json={"tipo": "ingreso", "categoria": "Arriendo salón", "monto": 20000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )
    movimiento_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/finanzas/movimientos/{movimiento_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_resumen_combina_movimientos_y_pagos(client, admin_user, auth_headers):
    await client.post("/api/v1/unidades", json={"numero": "101", "metraje": 50}, headers=auth_headers)
    creado = await client.post(
        "/api/v1/gastos-comunes",
        json={"anio": 2026, "mes": 7, "tarifa_m2": 1000},
        headers=auth_headers,
    )
    cargo_id = creado.json()["cargos"][0]["id"]
    await client.post(
        "/api/v1/pagos",
        json={"cargo_id": cargo_id, "monto": 50000, "metodo": "transferencia", "fecha_pago": "2026-07-05"},
        headers=auth_headers,
    )

    await client.post(
        "/api/v1/finanzas/movimientos",
        json={"tipo": "ingreso", "categoria": "Arriendo salón", "monto": 20000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )
    await client.post(
        "/api/v1/finanzas/movimientos",
        json={"tipo": "egreso", "categoria": "Mantención", "monto": 30000, "fecha": "2026-07-05"},
        headers=auth_headers,
    )

    resumen = await client.get("/api/v1/finanzas/resumen", headers=auth_headers)
    assert resumen.status_code == 200
    body = resumen.json()
    assert body["total_recaudado_gastos_comunes"] == "50000.00"
    assert body["total_ingresos_manuales"] == "20000.00"
    assert body["total_egresos"] == "30000.00"
    assert body["balance"] == "40000.00"


@pytest.mark.asyncio
async def test_finanzas_requiere_autenticacion(client):
    response = await client.get("/api/v1/finanzas/movimientos")
    assert response.status_code in (401, 403)
