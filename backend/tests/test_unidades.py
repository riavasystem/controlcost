import pytest


@pytest.mark.asyncio
async def test_crear_y_listar_unidad(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/unidades",
        json={"numero": "101", "torre": "A", "metraje": 55.5},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["numero"] == "101"
    assert body["total_residentes"] == 0

    listado = await client.get("/api/v1/unidades", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_crear_unidad_con_bodega(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/unidades",
        json={"numero": "101", "numero_bodega": "B-5", "metraje_bodega": 4.5},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["numero_bodega"] == "B-5"
    assert body["metraje_bodega"] == "4.50"


@pytest.mark.asyncio
async def test_crear_unidad_con_estacionamiento_discapacitados(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/unidades",
        json={"numero": "101", "estacionamiento_discapacitados": "D-2"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["estacionamiento_discapacitados"] == "D-2"


@pytest.mark.asyncio
async def test_no_permite_numero_duplicado(client, admin_user, auth_headers):
    await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    response = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_actualizar_unidad(client, admin_user, auth_headers):
    creada = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    unidad_id = creada.json()["id"]

    response = await client.put(
        f"/api/v1/unidades/{unidad_id}",
        json={"numero": "101", "torre": "B", "metraje": 40},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["torre"] == "B"


@pytest.mark.asyncio
async def test_eliminar_unidad_sin_residentes(client, admin_user, auth_headers):
    creada = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    unidad_id = creada.json()["id"]

    response = await client.delete(f"/api/v1/unidades/{unidad_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_no_elimina_unidad_con_residentes(client, admin_user, auth_headers):
    creada = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    unidad_id = creada.json()["id"]

    await client.post(
        "/api/v1/residentes",
        json={"unidad_id": unidad_id, "nombre": "Juan Pérez", "tipo": "propietario"},
        headers=auth_headers,
    )

    response = await client.delete(f"/api/v1/unidades/{unidad_id}", headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_unidades_requiere_autenticacion(client):
    response = await client.get("/api/v1/unidades")
    assert response.status_code in (401, 403)
