import Link from "next/link";
import { notFound } from "next/navigation";
import { getCliente } from "@/lib/actions/clientes";
import { ESTADO_LABELS, formatDate, formatDateShort, getMoneda } from "@/lib/utils";

export default async function ClienteDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [cliente, moneda] = await Promise.all([getCliente(id), getMoneda()]);
  if (!cliente) notFound();

  return (
    <>
      <header className="content-header">
        <div className="header-row">
          <h1>{cliente.nombre}</h1>
          <Link
            href={`/dashboard/clientes/${id}/editar`}
            className="btn-primary btn-sm"
          >
            Editar
          </Link>
        </div>
      </header>
      <div className="content-body">
        <div className="detail-card">
          <h2>Información del cliente</h2>
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Teléfono</span>
              <span>{cliente.telefono ?? "-"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Email</span>
              <span>{cliente.email ?? "-"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Documento</span>
              <span>{cliente.documento ?? "-"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Notas</span>
              <span>{cliente.notas ?? "-"}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Registrado</span>
              <span>{formatDate(cliente.createdAt, moneda)}</span>
            </div>
          </div>
        </div>

        <h2 className="section-title">Órdenes ({cliente.ordenes.length})</h2>
        {cliente.ordenes.length === 0 ? (
          <p className="text-muted">
            Este cliente no tiene órdenes registradas.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Equipo</th>
                  <th>Estado</th>
                  <th>Ingreso</th>
                  <th>Recibido por</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cliente.ordenes.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.folio}</td>
                    <td>{o.tipoEquipo}</td>
                    <td>
                      <span className={`estado-badge estado-${o.estado.toLowerCase()}`}>
                        {ESTADO_LABELS[o.estado]}
                      </span>
                    </td>
                    <td>{formatDateShort(o.createdAt, moneda)}</td>
                    <td>{o.recibidoPor.nombre}</td>
                    <td>
                      <Link
                        href={`/dashboard/ordenes/${o.id}`}
                        className="btn-link"
                      >
                        Ver orden
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
