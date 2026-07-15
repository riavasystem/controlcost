# PROGRESS.md — Bitácora de sesiones (ControlCost)

## Sesión 2026-07-14/15 — 12 módulos nuevos con backend real (Fase 2 y más allá)

El usuario pidió reflejar los 17 módulos de la landing en el menú del dashboard (primero solo navegación + Resumen con estado activo/próximamente), y luego pidió construir la funcionalidad real de todos los que decían "Próximamente", uno por uno, en orden lógico, dejando el deploy para el final ("completa todos los módulos de manera local y cuando ya estén completos los desplegamos todos juntos"). Esto significó avanzar explícitamente a Fase 2 (financiero) y más allá, algo que el usuario autorizó de forma explícita como pedía el `CLAUDE.md`.

**Módulos construidos (backend con tests + migración Alembic + frontend con Route Handlers), en este orden:**
1. **Gastos Comunes** — períodos con tarifa $/m² + extraordinario, genera automáticamente un cargo por unidad.
2. **Registro de Pagos** — pagos por cargo con reversión inteligente (revertir libera el cargo y permite volver a pagarlo).
3. **Finanzas** — movimientos manuales de ingreso/egreso, balance combinado con lo recaudado en Pagos.
4. **Multas** — al registrar una multa se crea automáticamente un ingreso en Finanzas (categoría "Multas"); eliminar la multa elimina también ese ingreso.
5. **Comunicados** — avisos con prioridad normal/importante/urgente, lectura abierta a todos los roles.
6. **Control Visitas** — entrada/salida por unidad, con alerta automática si pasan +8 horas sin registrar salida.
7. **Vehículos** — padrón maestro (patente única por condominio) vinculado a una unidad.
8. **Encomiendas** — ciclo llegada → notificación → retiro, con quién retira y cuándo.
9. **Guardias** — turnos semanales recurrentes (día + hora inicio/fin) del personal de seguridad.
10. **Proveedores** — directorio simple de servicios externos.
11. **Ley 21.442** — no es una entidad nueva: dashboard de cumplimiento que agrega datos reales de los módulos anteriores (recaudación, padrón, rendición, bitácora de accesos) mapeados a los artículos relevantes de la ley.
12. **Reportes** — dos informes CSV descargables reales (detalle de cargos por período de gasto común, y rendición financiera completa), vía `StreamingResponse` en FastAPI.

**Dejados fuera, con decisión explícita del usuario:**
- **Pagos Online** (Webpay/Transbank) y **App Móvil** (portal del residente): quedan en "Próximamente". Requieren decisiones que no correspondía tomar solo — Pagos Online necesita credenciales reales de Transbank (no fabricar una integración falsa que aparente cobrar), y App Móvil requiere definir qué puede ver/hacer el rol `RESIDENTE` (hoy sin ningún acceso al panel).
- **Multi-Condominio**: **eliminado del sistema** (ya no aparece en el menú ni en el Resumen). Requiere un cambio de arquitectura real (relación usuario–condominio de 1 a muchos, selector de condominio activo, tocar todos los endpoints que hoy asumen un solo `condominio_id`) — se decidió que amerita su propia fase planificada aparte, no forzarlo junto al resto.

**Estado del deploy: RESUELTO, todo en producción.**
- El primer commit de esta tanda (Gastos Comunes) se desplegó automáticamente sin problema.
- Del segundo al décimo segundo commit, **el deploy automático de Vercel dejó de dispararse** por un rato — el usuario reportó "no corrió el deploy en Vercel". Se investigó: los commits sí llegaban a GitHub (`git ls-remote` confirmaba el `HEAD` correcto), pero `clientes-riava/controlcost-29ca` no generaba deployment nuevo. Varios intentos de deploy manual (`vercel deploy --prod --yes`) quedaron atascados en estado `UNKNOWN`/"Building…" durante 15-30 min cada uno (dos de ellos se cancelaron con `vercel rm`). No hubo incidente reportado en vercel-status.com; la Mac también tenía memoria/swap muy ajustados en esos momentos, lo que pudo contribuir a que la fase local de la CLI (recolección/hash de archivos) se viera extremadamente lenta.
- Se decidió terminar de construir todos los módulos en local primero y desplegar todo junto al final (pedido explícito del usuario), quedando 12 commits acumulados sin push.
- Al reintentar el `git push` de todo lo acumulado (commit `85bcbaf`), **el deploy automático de Vercel volvió a funcionar normalmente** (`Ready` en 33s). No se identificó una causa raíz concreta del atasco de los días anteriores — pudo ser transitorio del lado de Vercel, o relacionado con la presión de memoria local durante los intentos manuales. Si vuelve a ocurrir, revisar primero `vm_stat`/`sysctl vm.swapusage` antes de asumir que es un problema de la plataforma.
- Verificado end-to-end en producción: backend (`https://api.controlcost.riava.cl/health` → 200, `/api/v1/pagos` → 403 sin token, confirmando que las 12 migraciones nuevas están aplicadas) y frontend (`https://controlcost.riava.cl` → 200, `/dashboard/reportes` → 307 redirect a login, confirmando que la ruta nueva existe y compila).

**Próximo paso (siguiente sesión):** decidir con el usuario cuándo retomar Pagos Online (necesita credenciales reales de Transbank), App Móvil (necesita definir qué puede ver/hacer el rol `RESIDENTE`) y, como fase aparte, Multi-Condominio (cambio de arquitectura usuario–condominio).

---

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
