from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.condominio import Condominio
from app.models.gasto_comun import PeriodoGastoComun

MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


def _clp(valor: Decimal) -> str:
    return f"${valor:,.0f}".replace(",", ".")


def generar_pdf_periodo(condominio: Condominio, periodo: PeriodoGastoComun) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    elementos = []

    elementos.append(Paragraph(condominio.nombre, styles["Title"]))
    if condominio.direccion:
        ubicacion = condominio.direccion
        if condominio.comuna or condominio.ciudad:
            ubicacion += f" — {', '.join(filter(None, [condominio.comuna, condominio.ciudad]))}"
        elementos.append(Paragraph(ubicacion, styles["Normal"]))
    elementos.append(Spacer(1, 12))

    titulo = f"Gasto Común — {MESES[periodo.mes - 1]} {periodo.anio}"
    elementos.append(Paragraph(titulo, styles["Heading2"]))
    detalle_tarifa = f"Tarifa: {_clp(Decimal(str(periodo.tarifa_m2)))}/m²"
    if periodo.extraordinario and Decimal(str(periodo.extraordinario)) > 0:
        alcance = f"solo {periodo.extraordinario_torre}" if periodo.extraordinario_torre else "todas las unidades"
        detalle_tarifa += f" · Cobro Extra: {_clp(Decimal(str(periodo.extraordinario)))} ({alcance})"
    elementos.append(Paragraph(detalle_tarifa, styles["Normal"]))
    if periodo.descripcion:
        elementos.append(Paragraph(periodo.descripcion, styles["Normal"]))
    elementos.append(Spacer(1, 16))

    filas = [["Unidad", "Monto base", "Cobro Extra", "Total", "Estado"]]
    for cargo in sorted(periodo.cargos, key=lambda c: c.unidad.numero if c.unidad else ""):
        unidad_label = cargo.unidad.numero if cargo.unidad else "-"
        if cargo.unidad and cargo.unidad.torre:
            unidad_label += f" ({cargo.unidad.torre})"
        filas.append([
            unidad_label,
            _clp(Decimal(str(cargo.monto_base))),
            _clp(Decimal(str(cargo.monto_extraordinario))),
            _clp(Decimal(str(cargo.monto_total))),
            "Pagado" if cargo.pagado else "Pendiente",
        ])

    tabla = Table(filas, colWidths=[5 * cm, 3 * cm, 3 * cm, 3 * cm, 3 * cm])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    elementos.append(tabla)

    doc.build(elementos)
    return buffer.getvalue()
