import { getUser } from "@/lib/dal";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { ESTADO_LABELS, formatDateShort } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUser();
  const { conteos, atrasadas } = await getDashboardStats();

  const total = Object.values(conteos).reduce((a, b) => a + b, 0);

  return (
    <>
      <header className="content-header">
        <h1>Dashboard</h1>
      </header>
      <div className="content-body">
        {/* Tarjetas de conteo */}
        <div className="stats-grid">
          {Object.entries(ESTADO_LABELS).map(([estado, label]) => {
            const count = conteos[estado as keyof typeof conteos] ?? 0;
            return (
              <Link
                key={estado}
                href={`/dashboard/ordenes?estado=${estado}`}
                className={`stat-card estado-${estado.toLowerCase()}`}
              >
                <span className="stat-count">{count}</span>
                <span className="stat-label">{label}</span>
              </Link>
            );
          })}
          <div className="stat-card stat-total">
            <span className="stat-count">{total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Órdenes atrasadas */}
        <h2 className="section-title">Órdenes atrasadas</h2>
        {atrasadas.length === 0 ? (
          <p className="text-muted">No hay órdenes atrasadas.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Fecha prometida</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {await Promise.all(atrasadas.map(async (o) => (
                  <tr key={o.id} className="row-atrasada">
                    <td className="folio-cell">#{o.folio}</td>
                    <td>{o.cliente.nombre}</td>
                    <td>
                      <span
                        className={`estado-badge estado-${o.estado.toLowerCase()}`}
                      >
                        {ESTADO_LABELS[o.estado]}
                      </span>
                    </td>
                    <td className="text-danger">
                      {await formatDateShort(o.fechaPrometida)}
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
                )))}
              </tbody>
            </table>
          </div>
        )}

        <div className="dashboard-footer">
          <p className="text-muted">
            Bienvenido, {user?.nombre}.
          </p>
        </div>
      </div>
    </>
  );
}
