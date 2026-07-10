# CLAUDE.md — ControlCost (UrbanCore v2)

Guía de contexto para cualquier sesión de Claude que trabaje en este repositorio. Léeme antes de tocar código o infraestructura.

## Qué es este proyecto

ControlCost es la reconstrucción como SaaS del panel de gestión de condominios UrbanCore (v1: PHP plano + JSON, ver `/Users/richardchamorrohuircan/Documents/Proyectos Claude/UrbanCore/CLAUDE.md` para el análisis completo de qué se mantiene/elimina/corrige de esa versión — no lo dupliques aquí).

Stack: **FastAPI + SQLAlchemy 2.0 async + Alembic + JWT/bcrypt** (backend) — **Next.js 16 App Router + Tailwind + TanStack Query + Zustand** (frontend) — **PostgreSQL 16** — sin Docker (systemd nativo, decisión explícita, ver abajo).

Fase actual: **Fase 1 (identidad y unidades)**, en curso. No avanzar a Fase 2 (financiero/gastos comunes) sin que el usuario lo pida explícitamente — ver el orden de fases completo en el `CLAUDE.md` de UrbanCore v1.

## Estado: EN PRODUCCIÓN (desde 2026-07-10)

- Frontend: **https://controlcost.riava.cl** (Vercel, deploy automático en cada push a `main` sobre `frontend/`).
- Backend: **https://api.controlcost.riava.cl** (Hetzner, TLS con Let's Encrypt, deploy automático vía GitHub Actions en cada push a `main` sobre `backend/**`).
- Verificado end-to-end en producción real: login → cookie httpOnly → `/api/auth/me` → dashboard, con datos viajando Vercel → Hetzner → Postgres `controlcost_prod`.
- **Usuario admin de producción existente:** `admin@controlcost.cl` / `clave-segura-123` — es la misma credencial de prueba usada en local, creada solo para verificar el deploy. **Rotar esta clave (o borrar el usuario y crear uno real) antes de que cualquier condominio real use el sistema** — hoy cualquiera que lea este archivo puede entrar a producción con ella.

## Infraestructura real (ya provisionada, no hipotética)

| Recurso | Valor |
|---|---|
| Repositorio | `git@github-riavasystem:riavasystem/controlcost.git` (privado, org `riavasystem`) — usar ese host alias, no `github.com` a secas, para que se use la SSH key correcta de la cuenta riavasystem |
| Servidor Hetzner | `49.12.66.17`, Ubuntu 24.04, comparte host con `clientefiel` y `finopslatam` en `/opt/apps/` |
| Usuario Linux de la app | `controlcost` (creado, sin login directo por SSH) |
| Usuario de deploy | `deploy` (ya existía, compartido con otros proyectos del servidor; miembro del grupo `controlcost`) |
| Ruta de la app | `/opt/apps/controlcost/` con estructura `releases/<timestamp>/`, symlink `current -> releases/<x>`, `shared/{venv,uploads,logs,backups,run,.env}`, `scripts/` — mismo patrón que `clientefiel` |
| Base de datos prod | Postgres ya corriendo en el servidor (single instance compartida). DB `controlcost_prod`, rol `controlcost_user`. Password real está en `shared/.env` en el servidor (no versionado) |
| Puerto del API | `127.0.0.1:8001` (127.0.0.1:8000 ya lo usa `clientefiel-api`, 5001 lo usa `finops-api`) |
| systemd | `controlcost-api.service` — `enabled` + `active (running)`, puerto 8001, 2 workers |
| sudoers | `/etc/sudoers.d/deploy-controlcost`: `deploy` tiene NOPASSWD **solo** para `systemctl restart/status controlcost-api` — no se le dio sudo amplio |
| Deploy key del repo (para el servidor) | `/home/deploy/.ssh/controlcost_repo` + alias SSH `github-controlcost`. Ya agregada como Deploy Key de solo lectura en GitHub. Su host key (`github.com`) está en `/home/deploy/.ssh/known_hosts` — **esto costó el primer intento de deploy fallido** (ver "Incidentes ya resueltos" abajo) |
| Clave SSH del pipeline CI/CD (GitHub Actions → Hetzner) | Generada localmente en `~/.local-dev-cache/controlcost/deploy-key/controlcost_deploy` (fuera de iCloud), instalada en `/home/deploy/.ssh/authorized_keys`. Ya cargada como secret `HETZNER_SSH_PRIVATE_KEY` en GitHub |
| Frontend | **Desplegado en Vercel**, dominio `controlcost.riava.cl` (DNS en Cloudflare, proxy DNS-only) |
| Dominio del backend | `api.controlcost.riava.cl` — registro `A` en Cloudflare (DNS-only) → `49.12.66.17`, nginx + certbot (Let's Encrypt, renueva automático, expira 2026-10-08) |
| Redis | Ya corre en el servidor (`127.0.0.1:6379`), compartido; controlcost usa el índice de BD `1` (`redis://localhost:6379/1`) para no chocar con otros proyectos que usan el índice `0` |

### Por qué no Docker (decisión ya cerrada)

El usuario confirmó explícitamente **no usar Docker**, ni en local ni en Hetzner — systemd nativo + venv compartido en `shared/venv`, igual que el resto de apps del servidor. No reabrir esta decisión sin pedirlo el usuario.

### Por qué este layout de carpetas en Hetzner

No se inventó: se copió exactamente la convención ya en uso por `clientefiel` en el mismo servidor (`releases/current/shared`, deploy vía símlink atómico, `shared/venv` persistente entre releases). Antes de crear nada se hizo reconocimiento SSH de `clientefiel` y `finopslatam` para no introducir un patrón distinto al del resto del servidor.

## Pendientes manuales

Ninguno bloqueante — los 5 pendientes originales (deploy key, secrets de GitHub, proyecto Vercel, dominio+TLS, `FRONTEND_URL`) ya se resolvieron y el sistema está en producción (ver sección de arriba). Pendiente real que sigue abierto:

- **Rotar la contraseña del admin de producción** (`admin@controlcost.cl`) antes de dar el sistema a un condominio real — hoy usa la misma clave de prueba que local.

## Incidentes ya resueltos (para no volver a perder tiempo re-diagnosticando)

- **iCloud Drive colgando `pytest`/`npm`/`git`** — ver la sección dedicada más abajo. Se resolvió sacando `.venv`, `node_modules` y `.git` de la carpeta sincronizada.
- **`git push`/`git add` colgándose o crasheando con `pack-objects died of signal 10`** — mismo origen (iCloud + `.git` dentro de la carpeta sincronizada), resuelto al mover `.git` fuera con el mecanismo `gitdir:`.
- **Primer deploy a Hetzner falló con `Host key verification failed`** — el usuario `deploy` nunca se había conectado a `github.com` antes, así que no tenía su host key en `known_hosts` y la conexión no-interactiva de GitHub Actions no podía aceptarla. Se resolvió con `ssh-keyscan github.com >> /home/deploy/.ssh/known_hosts`. Si se agrega algún otro host remoto nuevo al pipeline de deploy en el futuro, hacer lo mismo primero.
- **`AttributeError: module 'bcrypt' has no attribute '__about__'`** al crear usuarios con `create_admin.py` — warning cosmético de una incompatibilidad menor entre `passlib` y `bcrypt>=4.1`, no afecta el resultado (el hash se genera igual, el usuario se crea correctamente). Se puede silenciar en el futuro fijando `bcrypt<4.1` en `requirements.txt`, pero no es urgente.

## Nota importante sobre iCloud Drive (evita perder tiempo re-descubriendo esto)

Este proyecto vive en `~/Documents/Proyectos Claude/controlcost`, que está sincronizado con iCloud Drive. Esto **rompe** operaciones con muchos archivos pequeños (venv de Python, `node_modules`, y el propio `.git`): el daemon `bird` de iCloud bloquea lecturas/escrituras y puede colgar `pytest`, `npm install` o `git push` por varios minutos o indefinidamente (síntoma: proceso con ~0% CPU, atascado en una syscall `read()`).

**Ya se resolvió así, no repetir el diagnóstico:**
- `backend/.venv` es un symlink a `~/.local-dev-cache/controlcost/backend-venv` (fuera de iCloud).
- `frontend/node_modules` es un symlink a `~/.local-dev-cache/controlcost/frontend-node_modules` (fuera de iCloud).
- El propio `.git` del repo es un símlink-archivo (`gitdir: ...`) apuntando a `~/.local-dev-cache/controlcost/dotgit` (fuera de iCloud) — por eso `git push` empezó a funcionar recién después de mover esto.
- La clave de deploy para GitHub Actions y el archivo con passwords generados (`hetzner-secrets.txt`) también viven en `~/.local-dev-cache/controlcost/`, no en el repo ni en iCloud.

Si en el futuro `pip install`, `npm install`, `pytest` o `git` se cuelgan sin razón aparente en esta máquina, sospechar primero de iCloud antes de asumir un bug de código — verificar con `brctl status` si el proyecto sigue bajo una carpeta sincronizada.

## Bases de datos locales vs. de test (evita el error ya cometido una vez)

Existen **tres** bases Postgres relacionadas con este proyecto — no cruzarlas:
- `controlcost_dev` (local, Mac) — la usa la app en desarrollo (`backend/.env`).
- `controlcost_test` (local, Mac) — la usan los tests (`pytest`). **Nunca correr los tests apuntando a `controlcost_dev`** — ya pasó una vez que el teardown de los tests (`Base.metadata.drop_all`) borró las tablas de dev por accidente al exportar mal `DATABASE_URL` antes de correr `pytest`.
- `controlcost_prod` (Hetzner) — producción real, rol `controlcost_user`.

## Qué evitar (recordatorios rápidos, el detalle completo está en el CLAUDE.md de UrbanCore v1)

- No usar Docker (decisión cerrada).
- No usar JSON como almacenamiento — todo vía Postgres + Alembic.
- No hardcodear credenciales de ningún tipo — el usuario admin de desarrollo se crea con `backend/scripts/create_admin.py`, nunca en el código.
- No avanzar de fase sin que el usuario lo pida.
- No tocar el proyecto v1 (`UrbanCore/`) — es de solo lectura/referencia.
