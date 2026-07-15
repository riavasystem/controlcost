import pytest


@pytest.mark.asyncio
async def test_resumen_cumplimiento_agrega_datos_reales(client, admin_user, auth_headers):
    await client.post("/api/v1/unidades", json={"numero": "101", "metraje": 50}, headers=auth_headers)
    await client.post(
        "/api/v1/residentes",
        json={
            "unidad_id": (await client.get("/api/v1/unidades", headers=auth_headers)).json()[0]["id"],
            "nombre": "Juan Pérez",
            "tipo": "propietario",
        },
        headers=auth_headers,
    )
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

    response = await client.get("/api/v1/ley21442/resumen", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_unidades"] == 1
    assert body["total_residentes"] == 1
    assert body["periodos_gasto_comun"] == 1
    assert body["total_recaudado_historico"] == "50000.00"
    assert body["total_pendiente_historico"] == "0.00"
    assert body["balance_financiero"] == "50000.00"


@pytest.mark.asyncio
async def test_ley21442_requiere_autenticacion(client):
    response = await client.get("/api/v1/ley21442/resumen")
    assert response.status_code in (401, 403)
