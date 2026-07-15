import pytest


async def _crear_unidad(client, auth_headers):
    response = await client.post("/api/v1/unidades", json={"numero": "101"}, headers=auth_headers)
    return response.json()["id"]


@pytest.mark.asyncio
async def test_registrar_llegada_y_listar(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)

    response = await client.post(
        "/api/v1/encomiendas",
        json={"unidad_id": unidad_id, "descripcion": "Paquete Amazon"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["estado"] == "pendiente"
    assert body["fecha_retiro"] is None

    listado = await client.get("/api/v1/encomiendas", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_no_permite_encomienda_con_unidad_inexistente(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/encomiendas",
        json={"unidad_id": "00000000-0000-0000-0000-000000000000", "descripcion": "Paquete"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_registrar_retiro(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/encomiendas",
        json={"unidad_id": unidad_id, "descripcion": "Paquete Amazon"},
        headers=auth_headers,
    )
    encomienda_id = creada.json()["id"]

    response = await client.patch(
        f"/api/v1/encomiendas/{encomienda_id}/retiro",
        params={"retirado_por": "Juan Pérez"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["estado"] == "retirado"
    assert response.json()["retirado_por"] == "Juan Pérez"


@pytest.mark.asyncio
async def test_no_permite_retiro_dos_veces(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/encomiendas",
        json={"unidad_id": unidad_id, "descripcion": "Paquete Amazon"},
        headers=auth_headers,
    )
    encomienda_id = creada.json()["id"]

    await client.patch(f"/api/v1/encomiendas/{encomienda_id}/retiro", headers=auth_headers)
    response = await client.patch(f"/api/v1/encomiendas/{encomienda_id}/retiro", headers=auth_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_eliminar_encomienda(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creada = await client.post(
        "/api/v1/encomiendas",
        json={"unidad_id": unidad_id, "descripcion": "Paquete Amazon"},
        headers=auth_headers,
    )
    encomienda_id = creada.json()["id"]

    response = await client.delete(f"/api/v1/encomiendas/{encomienda_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_encomiendas_requiere_autenticacion(client):
    response = await client.get("/api/v1/encomiendas")
    assert response.status_code in (401, 403)
