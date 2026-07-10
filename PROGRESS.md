# PROGRESS.md — Bitácora de sesiones (ControlCost)

## Sesión 2026-07-10

**Punto de partida:** el usuario dio luz verde a arrancar la reconstrucción real (no solo local): repo GitHub `git@github.com:riavasystem/controlcost.git`, servidor Hetzner `root@49.12.66.17` con convención `/opt/apps/<app>/` ya usada por otros proyectos del mismo servidor. Confirmó avanzar ya con las conexiones reales, y confirmó **no usar Docker** (systemd nativo) tanto en local como en Hetzner.

**Hecho en esta sesión:**

1. Reconocimiento SSH del servidor Hetzner: se descubrió la convención real ya en uso por `clientefiel` y `finopslatam` (releases/current/shared, systemd por app, nginx por subdominio, Postgres/Redis compartidos con DB por app) — se replicó ese mismo patrón para controlcost en vez de inventar uno nuevo.
2. Scaffold completo de Fase 0 + inicio de Fase 1:
   - Backend FastAPI: config, database (SQLAlchemy 2.0 async), security (JWT + bcrypt), dependencies (RBAC), modelos (`condominios`, `usuarios`, `unidades`, `residentes`), auth router (login/refresh/me), Alembic con la migración inicial, tests (pytest + httpx, 5 passing).
   - Frontend Next.js 16 (App Router, Turbopack): Tailwind, TanStack Query, Zustand, login vía Route Handlers que setean cookies httpOnly (los tokens JWT nunca tocan JS del cliente), `proxy.ts` (nuevo nombre de `middleware.ts` en Next 16) como guardia optimista de `/dashboard`, shell de dashboard con datos reales del usuario autenticado.
   - Verificado end-to-end en local: login → cookies → `/api/auth/me` → `/dashboard` protegido — funcionando.
3. **Incidente y causa raíz encontrada:** `pytest`, `git add`, `git push` se colgaban indefinidamente (varios minutos, a veces sin terminar nunca) sin razón aparente en el código. Causa real: el proyecto vive bajo `~/Documents/Proyectos Claude/`, sincronizado con iCloud Drive, cuyo daemon `bird` bloquea I/O cuando se crean muchos archivos pequeños de golpe (venv, `node_modules`, objetos de `.git`). Solución aplicada: `backend/.venv`, `frontend/node_modules` y el propio `.git` del repo se movieron fuera de iCloud (`~/.local-dev-cache/controlcost/`) y se reemplazaron por symlinks / un archivo `.git` tipo `gitdir:`. Después de esto, tests y `git push` funcionaron en segundos. **Ver la sección dedicada en `CLAUDE.md` — no volver a perder tiempo re-diagnosticando esto.**
4. Segundo incidente menor: se corrieron accidentalmente los tests apuntando a `controlcost_dev` en vez de `controlcost_test` antes de crear esta última, y el teardown de los tests borró las tablas de dev. Se recreó `controlcost_dev` limpia y se corrieron las migraciones de nuevo. Ya no vuelve a pasar: los tests siempre apuntan a `controlcost_test` explícitamente.
5. Primer commit y push exitoso a `riavasystem/controlcost` (rama `main`).
6. Provisioning real en Hetzner (todo verificado, no solo planeado):
   - Usuario Linux `controlcost` creado, con `deploy` agregado a su grupo.
   - Estructura `/opt/apps/controlcost/{releases,shared/{venv,uploads,logs,backups,run},scripts}` creada con permisos de grupo correctos (verificado que `deploy` puede escribir).
   - Base de datos `controlcost_prod` + rol `controlcost_user` creados en el Postgres compartido del servidor (password generado y guardado fuera del repo, en `~/.local-dev-cache/controlcost/hetzner-secrets.txt`).
   - `venv` compartido creado en `shared/venv`, `.env` de producción generado (con placeholder de `FRONTEND_URL` pendiente de la URL real de Vercel).
   - systemd unit `controlcost-api.service` creado (puerto 8001 — 8000 y 5001 ya los usan otros proyectos del servidor), aún no arrancado porque no hay ningún release desplegado todavía.
   - `sudoers.d/deploy-controlcost` con NOPASSWD **acotado** solo a `systemctl restart/status controlcost-api` (no sudo amplio).
   - Clave de deploy CI/CD generada localmente (fuera de iCloud) e instalada en `deploy@Hetzner`.
   - Deploy key de solo lectura generada **en el propio servidor** para que pueda clonar el repo privado — falta agregarla a GitHub (paso manual, ver `CLAUDE.md`).
7. GitHub Actions creados: `ci.yml` (lint+test backend, lint+typecheck+build frontend) y `deploy-backend.yml` (clona a `releases/<timestamp>`, instala deps, corre Alembic, symlink atómico a `current`, reinicia el servicio, health-check, conserva últimas 5 releases).

**Estado al cerrar la sesión:**

- Código en local y en GitHub: al día, funcionando en local end-to-end.
- Infraestructura de Hetzner: provisionada pero el servicio **aún no está corriendo en el servidor** — falta el primer deploy real, que a su vez depende de los 2 pendientes manuales de abajo.
- Frontend: no desplegado a Vercel todavía.

**Pendientes manuales antes de que el deploy automático funcione** (detalle completo con comandos en `CLAUDE.md`, sección "Pendientes manuales"):
1. Agregar la deploy key (generada en el servidor) a GitHub como Deploy Key de solo lectura.
2. Cargar `HETZNER_HOST`, `HETZNER_SSH_USER`, `HETZNER_SSH_PRIVATE_KEY` como secrets en GitHub Actions.
3. Crear el proyecto en Vercel (root `frontend/`).
4. Decidir el dominio público del backend y configurar nginx + TLS en Hetzner.
5. Actualizar `FRONTEND_URL` en el `.env` de producción del servidor una vez exista la URL de Vercel.

**Próximo paso inmediato (siguiente sesión):** una vez el usuario resuelva los 5 pendientes manuales, hacer push a `main` para disparar el primer deploy automático y confirmar que `controlcost-api.service` levanta y responde `/health` en el servidor. Después de eso, seguir con el resto de Fase 1 (CRUD de unidades/residentes en el frontend) antes de tocar Fase 2 (financiero).
