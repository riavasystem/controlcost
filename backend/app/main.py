from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, comunicados, finanzas, gastos_comunes, multas, pagos, residentes, unidades
from app.core.config import settings

app = FastAPI(
    title="ControlCost API",
    version="0.1.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(unidades.router, prefix="/api/v1")
app.include_router(residentes.router, prefix="/api/v1")
app.include_router(gastos_comunes.router, prefix="/api/v1")
app.include_router(pagos.router, prefix="/api/v1")
app.include_router(finanzas.router, prefix="/api/v1")
app.include_router(multas.router, prefix="/api/v1")
app.include_router(comunicados.router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
