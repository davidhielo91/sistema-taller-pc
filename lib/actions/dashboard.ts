"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import type { EstadoOrden } from "@prisma/client";

export async function getDashboardStats() {
  await verifySession();

  const grupoConteos = await prisma.orden.groupBy({
    by: ["estado"],
    _count: { id: true },
  });

  const conteos = Object.fromEntries(
    grupoConteos.map(({ estado, _count }) => [estado, _count.id])
  ) as Partial<Record<EstadoOrden, number>>;

  const estados: EstadoOrden[] = [
    "RECIBIDO",
    "EN_DIAGNOSTICO",
    "PRESUPUESTADO",
    "APROBADO",
    "EN_REPARACION",
    "LISTO",
    "ENTREGADO",
    "NO_APROBADO",
    "CANCELADO",
  ];
  const conteosCompletos = Object.fromEntries(
    estados.map((e) => [e, conteos[e] ?? 0])
  ) as Record<EstadoOrden, number>;

  const atrasadas = await prisma.orden.findMany({
    where: {
      estado: { notIn: ["ENTREGADO", "CANCELADO", "NO_APROBADO"] },
      fechaPrometida: { lt: new Date() },
    },
    orderBy: { fechaPrometida: "asc" },
    take: 10,
    include: {
      cliente: { select: { nombre: true } },
    },
  });

  return { conteos: conteosCompletos, atrasadas };
}
