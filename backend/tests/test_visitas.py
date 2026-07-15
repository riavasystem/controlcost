import pytest


async def _crear_unidad(client, auth_headers):
    response = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    return response.json()["id"]


@pytest.mark.asyncio
async def test_registrar_entrada_y_listar(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)

    response = await client.post(
        "/api/v1/visitas",
        json={"unidad_id": unidad_id, "nombre_visitante": "Juan Pérez"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["hora_salida"] is None
    assert body["alerta"] is False

    listado = await client.get("/api/v1/visitas", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_registrar_entrada_con_numero_estacionamiento(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)

    response = await client.post(
        "/api/v1/visitas",
        json={"unidad_id": unidad_id, "nombre_visitante": "Juan Pérez", "numero_estacionamiento": "V-4"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["numero_estacionamiento"] == "V-4"


@pytest.mark.asyncio
async def test_no_permite_visita_con_unidad_inexistente(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/visitas",
        json={"unidad_id": "00000000-0000-0000-0000-000000000000", "nombre_visitante": "Juan Pérez"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_registrar_salida(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/visitas",
        json={"unidad_id": unidad_id, "nombre_visitante": "Juan Pérez"},
        headers=auth_headers,
    )
    visita_id = creada.json()["id"]

    response = await client.patch(f"/api/v1/visitas/{visita_id}/salida", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["hora_salida"] is not None


@pytest.mark.asyncio
async def test_no_permite_salida_dos_veces(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/visitas",
        json={"unidad_id": unidad_id, "nombre_visitante": "Juan Pérez"},
        headers=auth_headers,
    )
    visita_id = creada.json()["id"]

    await client.patch(f"/api/v1/visitas/{visita_id}/salida", headers=auth_headers)
    response = await client.patch(f"/api/v1/visitas/{visita_id}/salida", headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_eliminar_visita(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/visitas",
        json={"unidad_id": unidad_id, "nombre_visitante": "Juan Pérez"},
        headers=auth_headers,
    )
    visita_id = creada.json()["id"]

    response = await client.delete(f"/api/v1/visitas/{visita_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_visitas_requiere_autenticacion(client):
    response = await client.get("/api/v1/visitas")
    assert response.status_code in (401, 403)
