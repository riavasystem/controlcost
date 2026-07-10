import os
import uuid

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "postgresql://controlcost_user:changeme@localhost:5432/controlcost_test")
os.environ.setdefault("JWT_SECRET", "test-secret-key-min-32-characters-long")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

from app.core.config import settings  # noqa: E402
from app.core.database import Base, get_db  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models.condominio import Condominio  # noqa: E402
from app.models.usuario import UserRole, Usuario  # noqa: E402


@pytest_asyncio.fixture
async def db_session():
    """Motor y sesión creados dentro del event loop propio de cada test,
    para evitar el error 'Event loop is closed' de asyncpg entre tests."""
    engine = create_async_engine(
        settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
        pool_pre_ping=True,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with session_factory() as session:
        yield session

    app.dependency_overrides.pop(get_db, None)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_user(db_session):
    condominio = Condominio(id=uuid.uuid4(), nombre="Condominio de Prueba")
    db_session.add(condominio)
    await db_session.flush()

    usuario = Usuario(
        id=uuid.uuid4(),
        condominio_id=condominio.id,
        email="admin@test.com",
        hashed_password=hash_password("clave-segura-123"),
        nombre="Admin de Prueba",
        rol=UserRole.ADMIN,
    )
    db_session.add(usuario)
    await db_session.commit()
    return usuario
