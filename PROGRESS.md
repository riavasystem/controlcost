# PROGRESS.md — Bitácora de sesiones (ControlCost)

## Sesión 2026-07-10 (parte 3) — Primer módulo real + landing pública

Continuación de las partes 1 y 2 del mismo día (auditoría/blueprint, luego puesta en producción). El usuario pidió rotar la credencial de prueba y avanzar con las páginas reales (landing + módulos), decidiendo hacerlo módulo por módulo empezando por residentes/unidades, y sí construir una landing de marketing en `/`.

**Hecho:**
1. Rotada la credencial de prueba: `admin@controlcost.cl` → `claudio.castro@riava.cl` con clave nueva, tanto en local (`controlcost_dev`) como en producción (`controlcost_prod`). Se creó `backend/scripts/rotate_admin.py` para poder repetir esto a futuro. Verificado que la credencial vieja ya no funciona.
2. Backend: CRUD completo de **unidades** y **residentes** (`app/api/unidades.py`, `app/api/residentes.py`, schemas correspondientes), con reglas de negocio reales: no se puede duplicar el número de una unidad, no se puede borrar una unidad con residentes asignados, todo scoped por `condominio_id` (multi-tenant). 15 tests nuevos, todos pasando.
3. Frontend: páginas `/dashboard/unidades` y `/dashboard/residentes` (listar/crear/editar/eliminar) vía Route Handlers de Next que reenvían la cookie httpOnly al backend (`lib/server-api.ts`, nuevo helper compartido). Landing page pública real en `/` (antes solo redirigía a `/login`), con metadata SEO (title/description/OpenGraph) — algo que la auditoría de v1 había señalado como ausente.
4. **Incidente de rendimiento serio, ya resuelto:** `npm run dev` tardaba minutos por request (`GET /login 200 in 3.5min`). Causa: `frontend/.next` (caché de Turbopack) seguía dentro de la carpeta sincronizada con iCloud — nunca se había sacado como sí se hizo con `node_modules`/`.venv`/`.git`. Se resolvió con el mismo patrón de symlink hacia `~/.local-dev-cache/controlcost/frontend-next-cache`. De paso se corrigió `frontend/.gitignore` (el patrón `/.next/` con slash final no matchea un symlink, mismo bug que ya había pasado con `.venv/`).
5. **Segundo incidente, esta vez de recursos de la Mac, no del proyecto:** después de arreglar lo de iCloud, `next dev` seguía sin arrancar en minutos razonables. Diagnóstico: la Mac tenía ~58MB de RAM libre de 8GB y 12.1GB/13.3GB de swap usado — el sistema estaba en *thrashing* por carga general (Chrome, una VM de VirtualBuddy, varias ventanas de VSCode), no por el código. Se mataron los procesos de dev locales para liberar algo de memoria y **se decidió saltar la verificación en localhost, verificando directo contra producción** (Vercel/Hetzner no comparten esa limitación).
6. Push a `main` → deploy automático del backend a Hetzner (release `20260710_203156`) y redeploy automático del frontend en Vercel. Verificado end-to-end **en producción real**: login → crear unidad → listarla, con `claudio.castro@riava.cl` sobre `https://controlcost.riava.cl` y `https://api.controlcost.riava.cl`. La unidad de prueba creada para verificar se borró después (`DELETE` real, confirmando que esa regla también funciona en producción).
7. Detalle técnico corregido: el campo `metraje` (un `Decimal` en el modelo SQLAlchemy) FastAPI lo serializa como **string** (`"55.50"`), no como `number` — se corrigió el tipo en `frontend/lib/types.ts` para que sea preciso (no había bug funcional, JS coacciona igual, pero el tipo estaba mal declarado).

**Estado al cerrar esta parte de la sesión:**
- En producción: landing pública + login + CRUD real de Unidades y Residentes, funcionando de punta a punta.
- Todavía sin construir: gastos comunes/financiero (Fase 2), RRHH/nómina (Fase 3), multas/vehículos/visitas/encomiendas/comunicados, portal de residente expandido (Fase 4).
- La Mac del usuario quedó con memoria/swap muy ajustados — si una sesión futura vuelve a ver todo extremadamente lento sin razón aparente en el código, revisar primero `vm_stat`/`sysctl vm.swapusage` antes de asumir un bug, y considerar verificar contra producción en vez de localhost si el problema persiste.

**Próximo paso (siguiente sesión):** seguir con el módulo de gastos comunes/financiero (Fase 2) siguiendo el mismo patrón ya validado (backend con tests → frontend con Route Handlers → verificar → deploy), corrigiendo desde el diseño los bugs que la auditoría de v1 encontró en ese módulo (IVA aplicado sobre partidas no gravadas, generación no transaccional). No avanzar a Fase 2 sin que el usuario lo confirme explícitamente, igual que las fases anteriores.

---

## Sesión 2026-07-10 (parte 2) — Puesta en producción

Continuación de la sesión del mismo día. El usuario resolvió los 5 pendientes manuales (deploy key, secrets de GitHub, proyecto Vercel, DNS/dominio) y se completó el primer deploy real.

**Hecho:**
1. Usuario agregó la Deploy Key a GitHub y los 3 secrets (`HETZNER_HOST`, `HETZNER_SSH_USER`, `HETZNER_SSH_PRIVATE_KEY`).
2. Usuario creó el proyecto en Vercel (`clientes-riava/controlcost-29ca`) — frontend visible desde el primer deploy.
3. Dominio elegido: `controlcost.riava.cl` (frontend) + `api.controlcost.riava.cl` (backend), DNS en Cloudflare.
   - Frontend: dominio agregado en Vercel, verificado vía CNAME + TXT en Cloudflare (proxy DNS-only) — quedó "Valid Configuration".
   - Backend: registro `A` en Cloudflare → `49.12.66.17` (DNS-only), nginx configurado, certificado emitido con `certbot --nginx` (expira 2026-10-08, renovación automática).
   - `FRONTEND_URL` actualizado en `/opt/apps/controlcost/shared/.env` → `https://controlcost.riava.cl`.
4. **Primer intento de deploy falló:** `Host key verification failed` — el usuario `deploy` en Hetzner nunca se había conectado a `github.com`, no tenía su host key. Se resolvió con `ssh-keyscan github.com >> /home/deploy/.ssh/known_hosts`. De paso se habilitó (`systemctl enable`) el servicio, que había quedado `disabled` desde su creación, y se agregó `workflow_dispatch` al workflow de deploy para poder dispararlo manualmente en el futuro sin depender de un push.
5. **Segundo intento: éxito.** `controlcost-api.service` quedó `active (running)`, release en `/opt/apps/controlcost/releases/20260710_193659`, symlink `current` apuntando ahí.
6. Se creó un usuario admin real en `controlcost_prod` (`admin@controlcost.cl` / `clave-segura-123` — **misma clave de prueba que en local, pendiente rotar antes de uso real**) y se verificó el flujo completo en producción: login en `https://controlcost.riava.cl` → cookie httpOnly → `https://api.controlcost.riava.cl/api/v1/auth/me` → datos correctos, todo sobre HTTPS real.

**Estado al cerrar la sesión: EN PRODUCCIÓN.**
- Frontend: https://controlcost.riava.cl (Vercel, deploy automático en push a `main`).
- Backend: https://api.controlcost.riava.cl (Hetzner, deploy automático en push a `main` sobre `backend/**`).
- Verificado end-to-end, sin errores pendientes.

**Único pendiente real:** rotar la contraseña del admin de producción antes de que un condominio real use el sistema (ver `CLAUDE.md`).

**Próximo paso (siguiente sesión):** seguir con el resto de Fase 1 — CRUD de unidades y residentes en el frontend (hoy el dashboard es solo un shell con datos del usuario autenticado, sin listas ni formularios reales todavía). No avanzar a Fase 2 (financiero/gastos comunes) sin que el usuario lo pida.
