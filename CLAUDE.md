# CLAUDE.md — ControlCost (UrbanCore v2)

Guía de contexto para cualquier sesión de Claude que trabaje en este repositorio. Léeme antes de tocar código o infraestructura.

## Qué es este proyecto

ControlCost es la reconstrucción como SaaS del panel de gestión de condominios UrbanCore (v1: PHP plano + JSON, ver `/Users/richardchamorrohuircan/Documents/Proyectos Claude/UrbanCore/CLAUDE.md` para el análisis completo de qué se mantiene/elimina/corrige de esa versión — no lo dupliques aquí).

Stack: **FastAPI + SQLAlchemy 2.0 async + Alembic + JWT/bcrypt** (backend) — **Next.js 16 App Router + Tailwind + TanStack Query + Zustand** (frontend) — **PostgreSQL 16** — sin Docker (systemd nativo, decisión explícita, ver abajo).

Fase actual: **Fase 1 (identidad y unidades)**, en curso. No avanzar a Fase 2 (financiero/gastos comunes) sin que el usuario lo pida explícitamente — ver el orden de fases completo en el `CLAUDE.md` de UrbanCore v1.

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
| systemd | `controlcost-api.service` ya creado (`ExecStart=... uvicorn app.main:app --port 8001 --workers 2`, `User=controlcost`). Aún no arrancado — no hay ningún release en `current` todavía |
| sudoers | `/etc/sudoers.d/deploy-controlcost`: `deploy` tiene NOPASSWD **solo** para `systemctl restart/status controlcost-api` — no se le dio sudo amplio |
| Deploy key del repo (para el servidor) | Generada en el propio Hetzner: `/home/deploy/.ssh/controlcost_repo` + alias SSH `github-controlcost` en `/home/deploy/.ssh/config`. La clave pública ya se generó — **falta que un humano la agregue como Deploy Key (solo lectura) en GitHub → riavasystem/controlcost → Settings → Deploy keys** (ver "Pendientes manuales" abajo) |
| Clave SSH del pipeline CI/CD (GitHub Actions → Hetzner) | Generada localmente en `~/.local-dev-cache/controlcost/deploy-key/controlcost_deploy` (fuera de iCloud). Su clave pública ya está instalada en `/home/deploy/.ssh/authorized_keys` del servidor. **Falta cargar la clave privada como secret `HETZNER_SSH_PRIVATE_KEY` en GitHub** (ver abajo) |
| Frontend | Aún no desplegado a Vercel — pendiente que el usuario cree el proyecto en Vercel apuntando a este repo (carpeta `frontend/`) |
| Redis | Ya corre en el servidor (`127.0.0.1:6379`), compartido; controlcost usa el índice de BD `1` (`redis://localhost:6379/1`) para no chocar con otros proyectos que usan el índice `0` |

### Por qué no Docker (decisión ya cerrada)

El usuario confirmó explícitamente **no usar Docker**, ni en local ni en Hetzner — systemd nativo + venv compartido en `shared/venv`, igual que el resto de apps del servidor. No reabrir esta decisión sin pedirlo el usuario.

### Por qué este layout de carpetas en Hetzner

No se inventó: se copió exactamente la convención ya en uso por `clientefiel` en el mismo servidor (`releases/current/shared`, deploy vía símlink atómico, `shared/venv` persistente entre releases). Antes de crear nada se hizo reconocimiento SSH de `clientefiel` y `finopslatam` para no introducir un patrón distinto al del resto del servidor.

## Pendientes manuales (requieren acción humana, no las puede hacer Claude sin acceso a las UIs)

1. **Agregar el Deploy Key de solo lectura a GitHub** para que Hetzner pueda clonar el repo:
   - Ir a `github.com/riavasystem/controlcost` → Settings → Deploy keys → Add deploy key.
   - Pegar el contenido de la clave pública generada en el servidor (se mostró en la sesión que hizo el provisioning; si se perdió, leerla con `ssh root@49.12.66.17 "cat /home/deploy/.ssh/controlcost_repo.pub"`).
   - No marcar "Allow write access" — el deploy solo necesita clonar.

2. **Cargar 3 secrets en GitHub** (repo → Settings → Secrets and variables → Actions):
   - `HETZNER_HOST` = `49.12.66.17`
   - `HETZNER_SSH_USER` = `deploy`
   - `HETZNER_SSH_PRIVATE_KEY` = contenido completo de `~/.local-dev-cache/controlcost/deploy-key/controlcost_deploy` (la clave **privada**, no la `.pub`). Este archivo vive fuera de iCloud a propósito — nunca commitear esta clave al repo.

3. **Crear el proyecto en Vercel** apuntando a este repo, root directory `frontend/`, variable de entorno `API_URL` apuntando al backend real una vez tenga dominio (hoy el backend solo es accesible en `127.0.0.1:8001` dentro del servidor — falta nginx + dominio, ver siguiente punto).

4. **Definir el dominio del backend y configurar nginx + TLS.** Aún no se decidió el dominio público para la API (ej. `api.controlcost.cl` o similar). Sin esto, el backend no es alcanzable desde Vercel en producción — solo funciona en local por ahora. Una vez el usuario dé el dominio: crear `/etc/nginx/sites-available/<dominio>` (mismo patrón que `api.finopslatam.com`, proxy a `127.0.0.1:8001`), `certbot` para TLS, symlink a `sites-enabled`, `nginx -t && systemctl reload nginx`.

5. **Actualizar `FRONTEND_URL` en `/opt/apps/controlcost/shared/.env`** (hoy tiene un placeholder `https://controlcost.vercel.app`) una vez exista la URL real de Vercel — de eso depende el CORS del backend.

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
