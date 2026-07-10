import pytest


async def _crear_unidad(client, auth_headers, numero="101"):
    response = await client.post("/api/v1/unidades", json={"numero": numero}, headers=auth_headers)
    return response.json()["id"]


@pytest.mark.asyncio
async def test_crear_y_listar_residente(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)

    response = await client.post(
        "/api/v1/residentes",
        json={"unidad_id": unidad_id, "nombre": "Juan Pérez", "rut": "11.111.111-1", "tipo": "propietario"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nombre"] == "Juan Pérez"
    assert body["unidad_numero"] == "101"

    listado = await client.get("/api/v1/residentes", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_crear_residente_con_unidad_inexistente(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/residentes",
        json={"unidad_id": "00000000-0000-0000-0000-000000000000", "nombre": "Juan Pérez", "tipo": "propietario"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_actualizar_residente(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creado = await client.post(
        "/api/v1/residentes",
        json={"unidad_id": unidad_id, "nombre": "Juan Pérez", "tipo": "propietario"},
        headers=auth_headers,
    )
    residente_id = creado.json()["id"]

    response = await client.put(
        f"/api/v1/residentes/{residente_id}",
        json={"unidad_id": unidad_id, "nombre": "Juan Pérez Soto", "tipo": "arrendatario"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == "Juan Pérez Soto"
    assert response.json()["tipo"] == "arrendatario"


@pytest.mark.asyncio
async def test_eliminar_residente(client, admin_user, auth_headers):
    unidad_id = await _crear_unidad(client, auth_headers)
    creado = await client.post(
        "/api/v1/residentes",
        json={"unidad_id": unidad_id, "nombre": "Juan Pérez", "tipo": "propietario"},
        headers=auth_headers,
    )
    residente_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/residentes/{residente_id}", headers=auth_headers)
    assert response.status_code == 204

    listado = await client.get("/api/v1/residentes", headers=auth_headers)
    assert listado.json() == []
