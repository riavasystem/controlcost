import pytest


@pytest.mark.asyncio
async def test_crear_y_listar_comunicado(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/comunicados",
        json={"titulo": "Corte de agua", "contenido": "Mañana de 9 a 12hrs", "prioridad": "urgente"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["prioridad"] == "urgente"
    assert body["autor_nombre"] == "Admin de Prueba"

    listado = await client.get("/api/v1/comunicados", headers=auth_headers)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


@pytest.mark.asyncio
async def test_prioridad_por_defecto_es_normal(client, admin_user, auth_headers):
    response = await client.post(
        "/api/v1/comunicados",
        json={"titulo": "Reunión de comité", "contenido": "Este viernes a las 19hrs"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["prioridad"] == "normal"


@pytest.mark.asyncio
async def test_eliminar_comunicado(client, admin_user, auth_headers):
    creado = await client.post(
        "/api/v1/comunicados",
        json={"titulo": "Aviso", "contenido": "Contenido", "prioridad": "importante"},
        headers=auth_headers,
    )
    comunicado_id = creado.json()["id"]

    response = await client.delete(f"/api/v1/comunicados/{comunicado_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_comunicados_requiere_autenticacion(client):
    response = await client.get("/api/v1/comunicados")
    assert response.status_code in (401, 403)
