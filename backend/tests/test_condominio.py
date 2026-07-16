import pytest


@pytest.mark.asyncio
async def test_obtener_condominio(client, admin_user, auth_headers):
    response = await client.get("/api/v1/condominio", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["nombre"] == "Condominio de Prueba"


@pytest.mark.asyncio
async def test_actualizar_condominio_sin_imagen(client, admin_user, auth_headers):
    response = await client.put(
        "/api/v1/condominio",
        data={
            "nombre": "Condominio Los Aromos",
            "direccion": "Av. Siempre Viva 123",
            "comuna": "Providencia",
            "ciudad": "Santiago",
            "estacionamientos_visita": "10",
            "estacionamientos_discapacitados": "2",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["nombre"] == "Condominio Los Aromos"
    assert body["comuna"] == "Providencia"
    assert body["ciudad"] == "Santiago"
    assert body["estacionamientos_visita"] == 10
    assert body["estacionamientos_discapacitados"] == 2
    assert body["imagen_url"] is None


@pytest.mark.asyncio
async def test_actualizar_condominio_con_imagen(client, admin_user, auth_headers, tmp_path, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "uploads_dir", str(tmp_path))

    response = await client.put(
        "/api/v1/condominio",
        data={"nombre": "Condominio Los Aromos"},
        files={"imagen": ("logo.png", b"fake-image-bytes", "image/png")},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["imagen_url"].startswith("/uploads/condominio/")
    assert body["imagen_url"].endswith(".png")


@pytest.mark.asyncio
async def test_actualizar_condominio_rechaza_extension_no_permitida(client, admin_user, auth_headers, tmp_path, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "uploads_dir", str(tmp_path))

    response = await client.put(
        "/api/v1/condominio",
        data={"nombre": "Condominio Los Aromos"},
        files={"imagen": ("archivo.txt", b"no es una imagen", "text/plain")},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_condominio_requiere_autenticacion(client):
    response = await client.get("/api/v1/condominio")
    assert response.status_code in (401, 403)
