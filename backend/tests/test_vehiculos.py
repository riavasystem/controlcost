import pytest


async def _crear_unidad(client, auth_headers, numero="101"):
    response = await client.post("/api/v1/unidades", json={"numero": numero}, headers=auth_headers)
    return response.json()["id"]


@pytest.mark.asyncio
async def test_crear_y_listar_vehiculo(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)

    response = await client.post(
        "/api/v1/vehiculos",
        json={"unidad_id": unidad_id, "patente": "ABCD12", "marca": "Toyota", "color": "Gris"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["unidad_numero"] == "101"

    listado = await client.get("/api/v1/vehiculos", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_no_permite_patente_duplicada(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    payload = {"unidad_id": unidad_id, "patente": "ABCD12"}

    await client.post("/api/v1/vehiculos", json=payload, headers=auth_headers)
    response = await client.post("/api/v1/vehiculos", json=payload, headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_no_permite_vehiculo_con_unidad_inexistente(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/vehiculos",
        json={"unidad_id": "00000000-0000-0000-0000-000000000000", "patente": "ABCD12"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_actualizar_vehiculo(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    otra_unidad_id = await _crear_unidad(client, auth_headers, "102")
    creado = await client.post(
        "/api/v1/vehiculos", json={"unidad_id": unidad_id, "patente": "ABCD12"}, headers=auth_headers
    )
    vehiculo_id = creado.json()["id"]

    response = await client.put(
        f"/api/v1/vehiculos/{vehiculo_id}",
        json={"unidad_id": otra_unidad_id, "patente": "ABCD12", "color": "Rojo"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["unidad_numero"] == "102"
    assert response.json()["color"] == "Rojo"


@pytest.mark.asyncio
async def test_eliminar_vehiculo(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creado = await client.post(
        "/api/v1/vehiculos", json={"unidad_id": unidad_id, "patente": "ABCD12"}, headers=auth_headers
    )
    vehiculo_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/vehiculos/{vehiculo_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_vehiculos_requiere_autenticacion(client):
    response = await client.get("/api/v1/vehiculos")
    assert response.status_code in (401, 403)
