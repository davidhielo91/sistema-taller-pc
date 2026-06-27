import { getReportes } from "@/lib/actions/reportes";
import { getMoneda, formatCurrency, formatDateShort } from "@/lib/format";

export default async function ReportesPage(props: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const searchParams = await props.searchParams;
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const desdeStr =
    searchParams.desde ?? primerDiaMes.toISOString().split("T")[0];
  const hastaStr = searchParams.hasta ?? ahora.toISOString().split("T")[0];

  const desde = new Date(desdeStr);
  const hasta = new Date(hastaStr);

  const [datos, moneda] = await Promise.all([
    getReportes(desde, hasta),
    getMoneda(),
  ]);

  const {
    totalIngresos,
    totalReparaciones,
    tiempoPromedioDias,
    porTecnico,
    entregadas,
  } = datos;

  return (
    <>
      <header className="content-header">
        <h1>Reportes</h1>
      </header>
      <div className="content-body">
        {/* Filtro de rango de fechas */}
        <div className="detail-card">
          <form method="GET" className="form-row" style={{ alignItems: "flex-end", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="desde">Desde</label>
              <input type="date" id="desde" name="desde" defaultValue={desdeStr} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="hasta">Hasta</label>
              <input type="date" id="hasta" name="hasta" defaultValue={hastaStr} />
            </div>
            <button type="submit" className="btn-primary">
              Filtrar
            </button>
          </form>
        </div>

        {/* Tarjetas de resumen */}
        <div className="reportes-resumen">
          <div className="reporte-card">
            <span className="reporte-label">Ingresos del período</span>
            <span className="reporte-valor">
              {formatCurrency(totalIngresos, moneda)}
            </span>
          </div>
          <div className="reporte-card">
            <span className="reporte-label">Reparaciones entregadas</span>
            <span className="reporte-valor">{totalReparaciones}</span>
          </div>
          <div className="reporte-card">
            <span className="reporte-label">Tiempo promedio de entrega</span>
            <span className="reporte-valor">
              {tiempoPromedioDias != null
                ? `${tiempoPromedioDias.toFixed(1)} días`
                : "—"}
            </span>
          </div>
        </div>

        {/* Entregas por técnico */}
        {porTecnico.length > 0 && (
          <div className="detail-card">
            <h2>Entregas por técnico</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Órdenes entregadas</th>
                </tr>
              </thead>
              <tbody>
                {porTecnico.map(([nombre, count]) => (
                  <tr key={nombre}>
                    <td>{nombre}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalle de órdenes entregadas */}
        <div className="detail-card">
          <h2>Órdenes entregadas en el período</h2>
          {entregadas.length === 0 ? (
            <p className="text-muted">
              Sin órdenes entregadas en el período seleccionado.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Fecha de entrega</th>
                  <th>Días transcurridos</th>
                  <th>Técnico</th>
                </tr>
              </thead>
              <tbody>
                {entregadas.map((o) => {
                  const dias = (
                    (o.fechaEntrega!.getTime() - o.fechaIngreso.getTime()) /
                    (1000 * 60 * 60 * 24)
                  ).toFixed(1);
                  return (
                    <tr key={o.id}>
                      <td>#{o.folio}</td>
                      <td>{o.cliente.nombre}</td>
                      <td>{formatDateShort(o.fechaEntrega, moneda)}</td>
                      <td>{dias}</td>
                      <td>{o.entregadoPor?.nombre ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
