import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import { formatDateShort } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

export default async function ComprobantePage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await decrypt((await cookies()).get("session")?.value);
  if (!session?.userId) return notFound();

  const { id } = await props.params;
  const orden = await prisma.orden.findUnique({
    where: { id },
    include: { cliente: true },
  });
  if (!orden) notFound();

  const ajustes = await prisma.ajustes.findUnique({ where: { id: 1 } });

  return (
    <>
      <style>{`
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #1a1a1a; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 4px 0; color: #666; font-size: 13px; }
        .folio { font-size: 28px; font-weight: 700; text-align: center; margin: 20px 0; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
        .row { display: flex; justify-content: space-between; padding: 3px 0; }
        .label { color: #666; min-width: 140px; }
        .value { font-weight: 500; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      `}</style>
      <div className="no-print" style={{ marginBottom: 20 }}>
        <PrintButton />
      </div>

      <div className="header">
        <h1>{ajustes?.nombreTaller ?? "Taller de reparación"}</h1>
        {ajustes?.direccion && <p>{ajustes.direccion}</p>}
        {ajustes?.telefono && <p>Tel: {ajustes.telefono}</p>}
      </div>

      <div className="folio">
        Comprobante de ingreso #{orden.folio}
      </div>

      <div className="section">
        <h2>Datos del cliente</h2>
        <div className="row"><span className="label">Nombre</span><span className="value">{orden.cliente.nombre}</span></div>
        {orden.cliente.telefono && <div className="row"><span className="label">Teléfono</span><span className="value">{orden.cliente.telefono}</span></div>}
        {orden.cliente.email && <div className="row"><span className="label">Email</span><span className="value">{orden.cliente.email}</span></div>}
      </div>

      <div className="section">
        <h2>Datos del equipo</h2>
        <div className="row"><span className="label">Tipo</span><span className="value">{orden.tipoEquipo}</span></div>
        {orden.marca && <div className="row"><span className="label">Marca</span><span className="value">{orden.marca}</span></div>}
        {orden.modelo && <div className="row"><span className="label">Modelo</span><span className="value">{orden.modelo}</span></div>}
        {orden.serie && <div className="row"><span className="label">Serie</span><span className="value">{orden.serie}</span></div>}
      </div>

      <div className="section">
        <h2>Recepción</h2>
        <div className="row"><span className="label">Falla reportada</span><span className="value">{orden.fallaReportada}</span></div>
        {orden.accesorios && <div className="row"><span className="label">Accesorios</span><span className="value">{orden.accesorios}</span></div>}
        {orden.estadoFisico && <div className="row"><span className="label">Estado físico</span><span className="value">{orden.estadoFisico}</span></div>}
        <div className="row"><span className="label">Fecha de ingreso</span><span className="value">{formatDateShort(orden.fechaIngreso, ajustes?.moneda ?? "MXN")}</span></div>
        <div className="row"><span className="label">Fecha prometida</span><span className="value">{formatDateShort(orden.fechaPrometida, ajustes?.moneda ?? "MXN")}</span></div>
      </div>

      <div className="footer">
        <p>Este comprobante es de uso interno del taller.</p>
        <p>Generado el {new Date().toLocaleDateString("es-MX")}</p>
      </div>
    </>
  );
}
