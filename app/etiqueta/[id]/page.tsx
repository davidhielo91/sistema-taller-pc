import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import { formatDateShort } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export default async function EtiquetaPage(props: {
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
  const moneda = ajustes?.moneda ?? "MXN";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 20px; }
        .no-print { margin-bottom: 20px; }
        .etiqueta {
          border: 2px solid #1a1a1a;
          border-radius: 8px;
          padding: 16px 20px;
          max-width: 320px;
          page-break-inside: avoid;
        }
        .etiqueta-taller {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .etiqueta-folio { font-size: 48px; font-weight: 700; line-height: 1; margin-bottom: 10px; }
        .etiqueta-cliente { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
        .etiqueta-equipo { font-size: 14px; color: #444; margin-bottom: 4px; }
        .etiqueta-fecha {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
          border-top: 1px solid #ddd;
          padding-top: 8px;
        }
        @media print {
          body { padding: 10px; }
          .no-print { display: none; }
        }
      `}</style>
      <div className="no-print">
        <PrintButton />
      </div>
      <div className="etiqueta">
        {ajustes?.nombreTaller && (
          <div className="etiqueta-taller">{ajustes.nombreTaller}</div>
        )}
        <div className="etiqueta-folio">#{orden.folio}</div>
        <div className="etiqueta-cliente">{orden.cliente.nombre}</div>
        <div className="etiqueta-equipo">
          {orden.tipoEquipo}
          {orden.marca ? ` · ${orden.marca}` : ""}
          {orden.modelo ? ` ${orden.modelo}` : ""}
        </div>
        <div className="etiqueta-fecha">
          Ingreso: {formatDateShort(orden.fechaIngreso, moneda)}
        </div>
      </div>
    </>
  );
}
