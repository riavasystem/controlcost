# PROGRESS.md — Bitácora de sesiones (ControlCost)

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
