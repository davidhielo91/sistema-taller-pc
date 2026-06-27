"use server";

import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function getReportes(desde: Date, hasta: Date) {
  await verifySession();

  const hastaFin = new Date(hasta);
  hastaFin.setHours(23, 59, 59, 999);

  const [sumaPagos, entregadas] = await Promise.all([
    prisma.pago.aggregate({
      where: { createdAt: { gte: desde, lte: hastaFin } },
      _sum: { monto: true },
    }),
    prisma.orden.findMany({
      where: {
        estado: "ENTREGADO",
        fechaEntrega: { gte: desde, lte: hastaFin },
      },
      select: {
        id: true,
        folio: true,
        fechaIngreso: true,
        fechaEntrega: true,
        entregadoPor: { select: { nombre: true } },
        cliente: { select: { nombre: true } },
      },
      orderBy: { fechaEntrega: "asc" },
    }),
  ]);

  const totalIngresos =
    sumaPagos._sum.monto != null ? Number(sumaPagos._sum.monto) : 0;
  const totalReparaciones = entregadas.length;

  const tiempoPromedioDias =
    entregadas.length > 0
      ? entregadas.reduce((acc, o) => {
          const ms = o.fechaEntrega!.getTime() - o.fechaIngreso.getTime();
          return acc + ms / (1000 * 60 * 60 * 24);
        }, 0) / entregadas.length
      : null;

  const porTecnico: Record<string, number> = {};
  for (const o of entregadas) {
    const nombre = o.entregadoPor?.nombre ?? "Sin técnico";
    porTecnico[nombre] = (porTecnico[nombre] ?? 0) + 1;
  }

  return {
    totalIngresos,
    totalReparaciones,
    tiempoPromedioDias,
    porTecnico: Object.entries(porTecnico).sort((a, b) => b[1] - a[1]),
    entregadas,
  };
}
