"""Renombra el email y rota la clave de un usuario existente (para reemplazar
credenciales de prueba por una credencial real).

Uso: python scripts/rotate_admin.py <email_actual> <email_nuevo> <password_nueva>
"""

import asyncio
import sys

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.usuario import Usuario


async def main() -> None:
    email_actual = sys.argv[1]
    email_nuevo = sys.argv[2]
    password_nueva = sys.argv[3]

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Usuario).where(Usuario.email == email_actual))
        usuario = result.scalar_one_or_none()
        if usuario is None:
            print(f"No existe ningún usuario con email {email_actual}")
            return

        usuario.email = email_nuevo
        usuario.hashed_password = hash_password(password_nueva)
        await session.commit()
        print(f"Rotado: {email_actual} -> {email_nuevo}")


if __name__ == "__main__":
    asyncio.run(main())
