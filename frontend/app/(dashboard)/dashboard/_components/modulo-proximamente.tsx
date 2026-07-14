export function ModuloProximamente({
  icon,
  name,
  description,
}: {
  icon: string;
  name: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <i className={`fa-solid ${icon}`} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">{name}</h1>
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Próximamente
        </span>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
        <p className="mt-3 text-sm text-slate-500">
          Este módulo todavía no está construido — se habilitará en una próxima fase del proyecto.
        </p>
      </div>
    </div>
  );
}
