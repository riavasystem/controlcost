import csv
import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.finanza import MovimientoFinanciero
from app.models.gasto_comun import CargoUnidad, PeriodoGastoComun
from app.models.usuario import UserRole, Usuario

router = APIRouter(prefix="/reportes", tags=["reportes"])


def _csv_response(filename: str, header: list[str], rows: list[list[str]]) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    writer.writerows(rows)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/gastos-comunes/{periodo_id}")
async def reporte_gastos_comunes(
    periodo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> StreamingResponse:
    result = await db.execute(
        select(PeriodoGastoComun)
        .options(joinedload(PeriodoGastoComun.cargos).joinedload(CargoUnidad.unidad))
        .where(PeriodoGastoComun.id == periodo_id, PeriodoGastoComun.condominio_id == current_user.condominio_id)
    )
    periodo = result.unique().scalar_one_or_none()
    if periodo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Período no encontrado")

    filas = [
        [
            f"{c.unidad.numero}" + (f" ({c.unidad.torre})" if c.unidad.torre else ""),
            str(c.monto_base),
            str(c.monto_extraordinario),
            str(c.monto_total),
            "Pagado" if c.pagado else "Pendiente",
        ]
        for c in periodo.cargos
    ]

    return _csv_response(
        f"gastos-comunes-{periodo.anio}-{periodo.mes:02d}.csv",
        ["Unidad", "Monto base", "Extraordinario", "Total", "Estado"],
        filas,
    )


@router.get("/financiero")
async def reporte_financiero(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_roles(UserRole.ADMIN, UserRole.CONTADOR)),
) -> StreamingResponse:
    result = await db.execute(
        select(MovimientoFinanciero)
        .where(MovimientoFinanciero.condominio_id == current_user.condominio_id)
        .order_by(MovimientoFinanciero.fecha)
    )
    movimientos = result.scalars().all()

    filas = [
        [
            m.fecha.isoformat(),
            "Ingreso" if m.tipo.value == "ingreso" else "Egreso",
            m.categoria,
            m.descripcion or "",
            str(m.monto),
        ]
        for m in movimientos
    ]

    return _csv_response(
        "reporte-financiero.csv",
        ["Fecha", "Tipo", "Categoría", "Descripción", "Monto"],
        filas,
    )
