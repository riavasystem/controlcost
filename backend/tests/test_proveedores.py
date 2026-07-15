import pytest


@pytest.mark.asyncio
async def test_crear_y_listar_proveedor(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/proveedores",
        json={"nombre_empresa": "Jardines del Sur", "rubro": "Jardinería", "telefono": "+56912345678"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["nombre_empresa"] == "Jardines del Sur"

    listado = await client.get("/api/v1/proveedores", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_actualizar_proveedor(client, admin_user, auth_headers):
    creado = await client.post(
        "/api/v1/proveedores",
        json={"nombre_empresa": "Jardines del Sur", "rubro": "Jardinería"},
        headers=auth_headers,
    )
    proveedor_id = creado.json()["id"]

    response = await client.put(
        f"/api/v1/proveedores/{proveedor_id}",
        json={"nombre_empresa": "Jardines del Sur", "rubro": "Jardinería", "telefono": "+56900000000"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["telefono"] == "+56900000000"


@pytest.mark.asyncio
async def test_eliminar_proveedor(client, admin_user, auth_headers):
    creado = await client.post(
        "/api/v1/proveedores",
        json={"nombre_empresa": "Jardines del Sur", "rubro": "Jardinería"},
        headers=auth_headers,
    )
    proveedor_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/proveedores/{proveedor_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_proveedores_requiere_autenticacion(client):
    response = await client.get("/api/v1/proveedores")
    assert response.status_code in (401, 403)
