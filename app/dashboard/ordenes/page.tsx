import Link from "next/link";
import { getOrdenes } from "@/lib/actions/ordenes";
import {
  ESTADO_LABELS,
  ESTADO_PAGO_LABELS,
  formatDateShort,
  getMoneda,
  ordenEstaAtrasada,
} from "@/lib/utils";

export default async function OrdenesPage(props: {
  searchParams: Promise<{ q?: string; estado?: string; estadoPago?: string }>;
}) {
  const searchParams = await props.searchParams;
  const [ordenes, moneda] = await Promise.all([
    getOrdenes(searchParams.q, searchParams.estado, searchParams.estadoPago),
    getMoneda(),
  ]);

  return (
    <>
      <header className="content-header">
        <h1>Órdenes</h1>
        <Link href="/dashboard/ordenes/nueva" className="btn-primary btn-sm">
          Nueva orden
        </Link>
      </header>
      <div className="content-body">
        <form className="search-bar" method="GET">
          <input
            name="q"
            type="search"
            placeholder="Buscar por folio, cliente o teléfono..."
            defaultValue={searchParams.q ?? ""}
          />
          <select name="estado" defaultValue={searchParams.estado ?? ""}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select name="estadoPago" defaultValue={searchParams.estadoPago ?? ""}>
            <option value="">Todos los pagos</option>
            {Object.entries(ESTADO_PAGO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary btn-sm">
            Buscar
          </button>
        </form>

        {ordenes.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron órdenes.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Ingreso</th>
                  <th>Fecha prometida</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => {
                  const atrasada = ordenEstaAtrasada(o.estado, o.fechaPrometida);
                  return (
                    <tr key={o.id} className={atrasada ? "row-atrasada" : ""}>
                      <td className="folio-cell">#{o.folio}</td>
                      <td>{o.cliente.nombre}</td>
                      <td>{o.tipoEquipo}</td>
                      <td>
                        <span
                          className={`estado-badge estado-${o.estado.toLowerCase()}`}
                        >
                          {ESTADO_LABELS[o.estado]}
                          {atrasada && " ⏰"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`estado-badge pago-${o.estadoPago.toLowerCase()}`}
                        >
                          {ESTADO_PAGO_LABELS[o.estadoPago]}
                        </span>
                      </td>
                      <td>{formatDateShort(o.createdAt, moneda)}</td>
                      <td>
                        <span
                          className={
                            atrasada ? "text-danger" : "text-muted"
                          }
                        >
                          {formatDateShort(o.fechaPrometida, moneda)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/ordenes/${o.id}`}
                          className="btn-link"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
