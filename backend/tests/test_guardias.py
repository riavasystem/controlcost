import pytest


@pytest.mark.asyncio
async def test_crear_y_listar_turno(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/guardias",
        json={
            "nombre_guardia": "Pedro Soto",
            "dia_semana": "lunes",
            "hora_inicio": "08:00:00",
            "hora_fin": "20:00:00",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nombre_guardia"] == "Pedro Soto"

    listado = await client.get("/api/v1/guardias", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_actualizar_turno(client, admin_user, auth_headers):
    creado = await client.post(
        "/api/v1/guardias",
        json={
            "nombre_guardia": "Pedro Soto",
            "dia_semana": "lunes",
            "hora_inicio": "08:00:00",
            "hora_fin": "20:00:00",
        },
        headers=auth_headers,
    )
    turno_id = creado.json()["id"]

    response = await client.put(
        f"/api/v1/guardias/{turno_id}",
        json={
            "nombre_guardia": "Pedro Soto",
            "dia_semana": "martes",
            "hora_inicio": "20:00:00",
            "hora_fin": "08:00:00",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["dia_semana"] == "martes"


@pytest.mark.asyncio
async def test_eliminar_turno(client, admin_user, auth_headers):
    creado = await client.post(
        "/api/v1/guardias",
        json={
            "nombre_guardia": "Pedro Soto",
            "dia_semana": "lunes",
            "hora_inicio": "08:00:00",
            "hora_fin": "20:00:00",
        },
        headers=auth_headers,
    )
    turno_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/guardias/{turno_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_guardias_requiere_autenticacion(client):
    response = await client.get("/api/v1/guardias")
    assert response.status_code in (401, 403)
