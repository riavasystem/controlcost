"""Crea (o resetea la clave de) un usuario admin de prueba para desarrollo local.

Uso: python scripts/create_admin.py <email> <password> [nombre_condominio]
"""

import asyncio
import sys
import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.condominio import Condominio
from app.models.usuario import UserRole, Usuario


async def main() -> None:
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@controlcost.local"
    password = sys.argv[2] if len(sys.argv) > 2 else "clave-segura-123"
    nombre_condominio = sys.argv[3] if len(sys.argv) > 3 else "Condominio Demo"

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Condominio).where(Condominio.nombre == nombre_condominio))
        condominio = result.scalar_one_or_none()
        if condominio is None:
            condominio = Condominio(id=uuid.uuid4(), nombre=nombre_condominio)
            session.add(condominio)
            await session.flush()

        result = await session.execute(select(Usuario).where(Usuario.email == email))
        usuario = result.scalar_one_or_none()
        if usuario is None:
            usuario = Usuario(
                id=uuid.uuid4(),
                condominio_id=condominio.id,
                email=email,
                hashed_password=hash_password(password),
                nombre="Administrador",
                rol=UserRole.ADMIN,
            )
            session.add(usuario)
            print(f"Usuario admin creado: {email}")
        else:
            usuario.hashed_password = hash_password(password)
            print(f"Clave actualizada para: {email}")

        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
