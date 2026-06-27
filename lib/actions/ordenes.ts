"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrdenSchema, CambioEstadoSchema } from "@/lib/validations";
import { verifySession } from "@/lib/dal";
import { TRANSICIONES, calcularEstadoPago } from "@/lib/utils";

export async function getOrdenes(
  search?: string,
  estado?: string,
  estadoPago?: string
) {
  await verifySession();

  const where: Prisma.OrdenWhereInput = {};
  if (
    estadoPago === "PENDIENTE" ||
    estadoPago === "ABONADO" ||
    estadoPago === "PAGADO"
  ) {
    where.estadoPago = estadoPago;
  }
  if (search) {
    const orFilters: Prisma.OrdenWhereInput["OR"] = [];
    const folioNum = Number(search);
    if (!isNaN(folioNum)) {
      orFilters.push({ folio: folioNum });
    }
    orFilters.push({
      cliente: { nombre: { contains: search, mode: "insensitive" as const } },
    });
    orFilters.push({ cliente: { telefono: { contains: search } } });
    where.OR = orFilters;
  }
  if (estado) {
    where.estado = estado as Prisma.EnumEstadoOrdenFilter["equals"];
  }

  return prisma.orden.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
      recibidoPor: { select: { nombre: true } },
    },
  });
}

export async function getOrden(id: string) {
  await verifySession();

  return prisma.orden.findUnique({
    where: { id },
    include: {
      cliente: true,
      recibidoPor: { select: { id: true, nombre: true } },
      entregadoPor: { select: { id: true, nombre: true } },
      diagnosticos: {
        orderBy: { createdAt: "desc" },
        include: { tecnico: { select: { nombre: true } } },
      },
      historial: {
        orderBy: { createdAt: "desc" },
        include: { usuario: { select: { nombre: true } } },
      },
      pagos: {
        orderBy: { createdAt: "asc" },
        include: { usuario: { select: { nombre: true } } },
      },
    },
  });
}

export async function createOrden(formData: FormData) {
  const session = await verifySession();

  const raw = Object.fromEntries(formData);
  const parsed = OrdenSchema.safeParse({
    ...raw,
    marca: raw.marca || null,
    modelo: raw.modelo || null,
    serie: raw.serie || null,
    accesorios: raw.accesorios || null,
    estadoFisico: raw.estadoFisico || null,
    notasRecepcion: raw.notasRecepcion || null,
    contrasenaEquipo: raw.contrasenaEquipo || null,
    fechaPrometida: raw.fechaPrometida || null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { fechaPrometida, ...data } = parsed.data;

  const orden = await prisma.orden.create({
    data: {
      ...data,
      fechaPrometida: fechaPrometida ? new Date(fechaPrometida) : null,
      recibidoPorId: session.userId,
    },
  });

  revalidatePath("/dashboard/ordenes");
  redirect(`/dashboard/ordenes/${orden.id}`);
}



export async function cambiarEstado(formData: FormData) {
  const session = await verifySession();

  const raw = Object.fromEntries(formData);
  const parsed = CambioEstadoSchema.safeParse({
    ...raw,
    costo: raw.costo ? Number(raw.costo) : null,
    trabajoRealizado: raw.trabajoRealizado || null,
    notasEntrega: raw.notasEntrega || null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { ordenId, nuevoEstado, trabajoRealizado, notasEntrega, costo } =
    parsed.data;
  const orden = await prisma.orden.findUnique({
    where: { id: ordenId },
    include: { pagos: { select: { monto: true } } },
  });

  if (!orden) {
    return { message: "Orden no encontrada" };
  }

  const transicionesValidas = TRANSICIONES[orden.estado];
  if (!transicionesValidas.includes(nuevoEstado)) {
    return {
      message: `No se puede cambiar de ${orden.estado} a ${nuevoEstado}`,
    };
  }

  await prisma.$transaction([
    prisma.orden.update({
      where: { id: ordenId },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === "ENTREGADO" && {
          fechaEntrega: new Date(),
          entregadoPorId: session.userId,
        }),
        ...(trabajoRealizado && { trabajoRealizado }),
        ...(notasEntrega && { notasEntrega }),
        ...(costo != null && {
          costo,
          estadoPago: calcularEstadoPago(
            costo,
            orden.pagos.reduce((acc, p) => acc + Number(p.monto), 0)
          ),
        }),
      },
    }),
    prisma.historialEstado.create({
      data: {
        ordenId,
        estadoAnterior: orden.estado,
        estadoNuevo: nuevoEstado,
        usuarioId: session.userId,
      },
    }),
  ]);

  revalidatePath(`/dashboard/ordenes/${ordenId}`);
  revalidatePath("/dashboard/ordenes");
  return { success: true };
}
