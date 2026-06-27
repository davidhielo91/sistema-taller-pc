import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrden } from "@/lib/actions/ordenes";
import {
  ESTADO_LABELS,
  TRANSICIONES,
  formatDate,
  formatDateShort,
  formatCurrency,
  getMoneda,
  ordenEstaAtrasada,
  esEstadoTerminal,
} from "@/lib/utils";
import { CambiarEstadoForm } from "./CambiarEstadoForm";
import { DiagnosticoForm } from "./DiagnosticoForm";
import { RegistrarEntregaForm } from "./RegistrarEntregaForm";
import { AprobarDiagnostico } from "./AprobarDiagnostico";

export default async function OrdenDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const orden = await getOrden(id);
  if (!orden) notFound();

  const moneda = await getMoneda();
  const atrasada = ordenEstaAtrasada(orden.estado, orden.fechaPrometida);
  const transicionesPosibles = TRANSICIONES[orden.estado];
  const terminal = esEstadoTerminal(orden.estado);
  const puedeEntregar =
    orden.estado === "LISTO" || orden.estado === "NO_APROBADO";

  return (
    <>
      <header className="content-header">
        <div className="header-row">
          <h1>
            Orden #{orden.folio}
            {atrasada && <span className="badge-atrasada"> Atrasada</span>}
          </h1>
          <span
            className={`estado-badge estado-badge-lg estado-${orden.estado.toLowerCase()}`}
          >
            {ESTADO_LABELS[orden.estado]}
          </span>
        </div>
        <Link
          href={`/comprobante/${id}`}
          target="_blank"
          className="btn-secondary btn-sm"
        >
          Comprobante PDF
        </Link>
      </header>
      <div className="content-body">
        <div className="detail-grid-2col">
          {/* Cliente */}
          <div className="detail-card">
            <h2>Cliente</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Nombre</span>
                <span>{orden.cliente.nombre}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Teléfono</span>
                <span>{orden.cliente.telefono ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Email</span>
                <span>{orden.cliente.email ?? "-"}</span>
              </div>
            </div>
          </div>

          {/* Equipo */}
          <div className="detail-card">
            <h2>Equipo</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Tipo</span>
                <span>{orden.tipoEquipo}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Marca</span>
                <span>{orden.marca ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Modelo</span>
                <span>{orden.modelo ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Serie</span>
                <span>{orden.serie ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Accesorios</span>
                <span>{orden.accesorios ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Contraseña</span>
                <span>{orden.contrasenaEquipo ? "••••••" : "-"}</span>
              </div>
            </div>
          </div>

          {/* Recepción */}
          <div className="detail-card">
            <h2>Recepción</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Falla reportada</span>
                <span>{orden.fallaReportada}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Estado físico</span>
                <span>{orden.estadoFisico ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Notas</span>
                <span>{orden.notasRecepcion ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Recibido por</span>
                <span>{orden.recibidoPor.nombre}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Fecha de ingreso</span>
                <span>{formatDate(orden.fechaIngreso, moneda)}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Fecha prometida</span>
                <span className={atrasada ? "text-danger" : ""}>
                  {formatDateShort(orden.fechaPrometida, moneda)}
                </span>
              </div>
            </div>
          </div>

          {/* Entrega */}
          <div className="detail-card">
            <h2>Entrega</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Costo</span>
                <span className="text-lg">
                  {formatCurrency(orden.costo ? Number(orden.costo) : null, moneda)}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Trabajo realizado</span>
                <span>{orden.trabajoRealizado ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Notas de entrega</span>
                <span>{orden.notasEntrega ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Entregado por</span>
                <span>{orden.entregadoPor?.nombre ?? "-"}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Fecha de entrega</span>
                <span>{formatDate(orden.fechaEntrega, moneda)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnósticos */}
        <div className="detail-card">
          <h2>Diagnósticos</h2>
          {orden.diagnosticos.length === 0 ? (
            <p className="text-muted">Sin diagnósticos registrados.</p>
          ) : (
            <div className="diagnosticos-list">
              {orden.diagnosticos.map((d) => (
                  <div key={d.id} className="diagnostico-item">
                    <div className="diagnostico-header">
                      <span className="text-muted">
                        {formatDate(d.createdAt, moneda)} - {d.tecnico.nombre}
                      </span>
                      <span>
                        {d.aprobado === true && (
                          <span className="estado-badge estado-listo">
                            Aprobado
                          </span>
                        )}
                        {d.aprobado === false && (
                          <span className="estado-badge estado-cancelado">
                            Rechazado
                          </span>
                        )}
                        {d.aprobado === null && (
                          <span className="estado-badge estado-recibido">
                            Pendiente
                          </span>
                        )}
                      </span>
                    </div>
                    <p>
                      <strong>Hallazgos:</strong> {d.hallazgos}
                    </p>
                    {d.solucionPropuesta && (
                      <p>
                        <strong>Solución propuesta:</strong>{" "}
                        {d.solucionPropuesta}
                      </p>
                    )}
                    {d.costoEstimado != null && (
                      <p>
                        <strong>Costo estimado:</strong>{" "}
                        {formatCurrency(Number(d.costoEstimado), moneda)}
                      </p>
                    )}
                    {d.aprobado === null && (
                      <AprobarDiagnostico diagnosticoId={d.id} />
                    )}
                  </div>
                ))}
            </div>
          )}
          {!terminal && (
            <div className="section-margin-top">
              <DiagnosticoForm ordenId={id} />
            </div>
          )}
        </div>

        {/* Registrar entrega (solo LISTO o NO_APROBADO) */}
        {puedeEntregar && (
          <RegistrarEntregaForm ordenId={id} moneda={moneda} />
        )}

        {/* Cambio de estado */}
        {!terminal &&
          transicionesPosibles.length > 0 &&
          !puedeEntregar && (
            <CambiarEstadoForm
              ordenId={orden.id}
              estadoActual={orden.estado}
              transiciones={transicionesPosibles}
              moneda={moneda}
            />
          )}

        {/* Bitácora de estados */}
        <div className="detail-card">
          <h2>Bitácora de cambios</h2>
          {orden.historial.length === 0 ? (
            <p className="text-muted">Sin cambios de estado registrados.</p>
          ) : (
            <ol className="timeline">
              {orden.historial.map((h) => (
                <li key={h.id} className="timeline-item">
                  <span className="timeline-fecha">
                    {formatDate(h.createdAt, moneda)}
                  </span>
                  <span className="timeline-evento">
                    {h.estadoAnterior && (
                      <>
                        <span
                          className={`estado-badge estado-${h.estadoAnterior.toLowerCase()}`}
                        >
                          {ESTADO_LABELS[h.estadoAnterior]}
                        </span>
                        <span className="timeline-arrow"> → </span>
                      </>
                    )}
                    <span
                      className={`estado-badge estado-${h.estadoNuevo.toLowerCase()}`}
                    >
                      {ESTADO_LABELS[h.estadoNuevo]}
                    </span>
                  </span>
                  <span className="timeline-usuario">{h.usuario.nombre}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
