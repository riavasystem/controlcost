#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
alembic upgrade head
exec uvicorn app.main:app --host 127.0.0.1 --port "${PORT:-8000}" --workers "${WEB_CONCURRENCY:-2}"
