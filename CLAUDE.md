# CLAUDE.md — ControlCost (UrbanCore v2)

Guía de contexto para cualquier sesión de Claude que trabaje en este repositorio. Léeme antes de tocar código o infraestructura.

## Qué es este proyecto

ControlCost es la reconstrucción como SaaS del panel de gestión de condominios UrbanCore (v1: PHP plano + JSON, ver `/Users/richardchamorrohuircan/Documents/Proyectos Claude/UrbanCore/CLAUDE.md` para el análisis completo de qué se mantiene/elimina/corrige de esa versión — no lo dupliques aquí).

Stack: **FastAPI + SQLAlchemy 2.0 async + Alembic + JWT/bcrypt** (backend) — **Next.js 16 App Router + Tailwind + TanStack Query + Zustand** (frontend) — **PostgreSQL 16** — sin Docker (systemd nativo, decisión explícita, ver abajo).

Fase actual: **Fase 1 (identidad y unidades)**, en curso. No avanzar a Fase 2 (financiero/gastos comunes) sin que el usuario lo pida explícitamente — ver el orden de fases completo en el `CLAUDE.md` de UrbanCore v1.

## Estado: EN PRODUCCIÓN (desde 2026-07-10)

- Frontend: **https://controlcost.riava.cl** — landing pública en `/` (con metadata SEO real), panel en `/login` → `/dashboard`. Deploy automático en cada push a `main`.
- Backend: **https://api.controlcost.riava.cl** (Hetzner, TLS con Let's Encrypt, deploy automático vía GitHub Actions en cada push a `main` sobre `backend/**`).
- Verificado end-to-end en producción real: login → cookie httpOnly → CRUD de unidades y residentes → datos viajando Vercel → Hetzner → Postgres `controlcost_prod`.
- **Usuario admin de producción:** `claudio.castro@riava.cl` — clave real, no compartida en este documento (rotada el 2026-07-10, ver `PROGRESS.md`). El script para rotar credenciales es `backend/scripts/rotate_admin.py <email_actual> <email_nuevo> <password_nueva>`.
- Módulos con CRUD real funcionando: **Unidades**, **Residentes** (ligados a una unidad, con validación multi-tenant por `condominio_id`). El resto de módulos de v1 (gastos comunes, RRHH, multas, vehículos, visitas, encomiendas, comunicados) siguen sin construir — ver el orden de fases en la sección de blueprint más abajo antes de empezar el siguiente.

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
- **CI de GitHub Actions falló con `npm ci`: "Missing: @emnapi/runtime@1.11.2 from lock file"**, y luego, tras un primer intento de arreglo, con `Cannot find module 'lightningcss.linux-x64-gnu.node'` — causa raíz: `frontend/package-lock.json` se había regenerado en esta Mac (macOS/arm64) con una versión de npm más nueva que la de CI, y npm solo registra en el lockfile los binarios nativos opcionales (`lightningcss-*`, `@next/swc-*`) de la plataforma donde se corrió `npm install`, no de todas. El runner de GitHub Actions es Linux x64 y no encontraba su variante. Se resolvió regenerando el lockfile forzando también la resolución linux (`npm install --os=linux --cpu=x64 --libc=glibc --package-lock-only` con `node_modules` vacío), lo que dejó ambas plataformas (`darwin-arm64` y `linux-x64-gnu`) registradas. Si se vuelve a regenerar el lockfile a mano en esta Mac, repetir este paso o el build en Linux (CI/Vercel) puede volver a romperse.

## Nota importante sobre iCloud Drive (evita perder tiempo re-descubriendo esto)

Este proyecto vive en `~/Documents/Proyectos Claude/controlcost`, que está sincronizado con iCloud Drive. Esto **rompe** operaciones con muchos archivos pequeños (venv de Python, `node_modules`, y el propio `.git`): el daemon `bird` de iCloud bloquea lecturas/escrituras y puede colgar `pytest`, `npm install` o `git push` por varios minutos o indefinidamente (síntoma: proceso con ~0% CPU, atascado en una syscall `read()`).

**Ya se resolvió así, no repetir el diagnóstico:**
- `backend/.venv` es un symlink a `~/.local-dev-cache/controlcost/backend-venv` (fuera de iCloud).
- `frontend/node_modules` es un symlink a `~/.local-dev-cache/controlcost/frontend-node_modules` (fuera de iCloud).
- **`frontend/.next`** (caché de Turbopack): idealmente symlink a `~/.local-dev-cache/controlcost/frontend-next-cache` (fuera de iCloud) para que `npm run dev` no tarde **minutos por request** (`GET /login 200 in 3.5min`, `Finished writing to filesystem cache in 8.1min`). **Pero ojo:** con `.next` symlinkeado fuera del proyecto, `npm run build` (Turbopack) falla con `Cannot find module '@tailwindcss/postcss'` — el chunk generado por Turbopack vive físicamente fuera del árbol del proyecto, así que la resolución de módulos de Node (que sube por los directorios padre buscando `node_modules`) no encuentra nada. Antes de correr `npm run build` en esta Mac, `.next` debe ser una carpeta real dentro de `frontend/` (borrar el symlink, dejar que Next cree el directorio real); para volver a `npm run dev` rápido, symlinkearlo de nuevo hacia el cache. En CI/Vercel esto no aplica — ahí `.next` siempre es real.
- **`frontend/node_modules` como symlink no sobrevive a `npm ci`:** `npm ci` borra lo que encuentre en `node_modules` y, si es un symlink, lo reemplaza por un directorio real (mensaje `npm warn reify Removing non-directory .../node_modules`) — vuelve a quedar dentro de iCloud. Si pasa, mover el contenido a `~/.local-dev-cache/controlcost/frontend-node_modules` y symlinkear de nuevo (o, más simple y rápido, borrar node_modules, crear la carpeta vacía en el cache, symlinkear, y recién ahí correr `npm ci`/`npm install` para que escriba directo ahí sin mover archivos después).
- El propio `.git` del repo es un símlink-archivo (`gitdir: ...`) apuntando a `~/.local-dev-cache/controlcost/dotgit` (fuera de iCloud) — por eso `git push` empezó a funcionar recién después de mover esto.
- La clave de deploy para GitHub Actions y el archivo con passwords generados (`hetzner-secrets.txt`) también viven en `~/.local-dev-cache/controlcost/`, no en el repo ni en iCloud.
- **Cuidado con `.gitignore`:** un patrón con `/` al final (`.venv/`, `/.next/`) solo matchea directorios reales, **no** un symlink con ese nombre — por eso más de una vez un symlink se coló en `git add -A`. Todos los patrones de estas carpetas movidas deben ir **sin slash final** (`.venv`, `/.next`, `/node_modules` ya estaba bien).

Si en el futuro `pip install`, `npm install`, `pytest`, `npm run dev` o `git` se cuelgan sin razón aparente en esta máquina, sospechar primero de iCloud antes de asumir un bug de código — verificar con `brctl status` si el proyecto sigue bajo una carpeta sincronizada, y revisar si alguna carpeta pesada nueva (caches, builds) quedó sin symlinkear afuera.

**Segundo sospechoso, si iCloud ya no explica la lentitud:** memoria/swap agotados en la Mac. Un incidente real: con 8GB de RAM y ~58MB libres + 12.1GB/13.3GB de swap usado, `next dev` tardó 10+ minutos en arrancar sin ningún error — solo estaba siendo paginado constantemente por el sistema operativo. Diagnóstico rápido: `vm_stat | grep "Pages free"` y `sysctl vm.swapusage`. Si la RAM libre es de pocos MB y el swap está casi lleno, el problema es de recursos del sistema (probablemente otras apps pesadas abiertas: VMs, muchas pestañas de Chrome, varios VSCode), no del código — parar procesos de desarrollo propios que no se estén usando y, si no alcanza, pedir al usuario cerrar aplicaciones. En ese caso, es válido saltar la verificación en localhost y verificar directo contra producción (Vercel/Hetzner no comparten esa limitación de recursos).

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
