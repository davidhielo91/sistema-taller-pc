"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PagoSchema } from "@/lib/validations";
import { verifySession } from "@/lib/dal";
import { calcularEstadoPago } from "@/lib/utils";

export async function registrarPago(formData: FormData) {
  const session = await verifySession();

  const raw = Object.fromEntries(formData);
  const parsed = PagoSchema.safeParse({
    ordenId: raw.ordenId,
    monto: raw.monto ? Number(raw.monto) : undefined,
    metodo: raw.metodo || null,
    nota: raw.nota || null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { ordenId, monto, metodo, nota } = parsed.data;

  const orden = await prisma.orden.findUnique({
    where: { id: ordenId },
    include: { pagos: { select: { monto: true } } },
  });

  if (!orden) return { message: "Orden no encontrada" };
  if (orden.estado === "CANCELADO") {
    return { message: "No se pueden registrar pagos en una orden cancelada" };
  }

  const totalActual = orden.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  const nuevoTotal = totalActual + monto;
  const nuevoEstadoPago = calcularEstadoPago(
    orden.costo != null ? Number(orden.costo) : null,
    nuevoTotal
  );

  await prisma.$transaction([
    prisma.pago.create({
      data: { ordenId, monto, metodo, nota, usuarioId: session.userId },
    }),
    prisma.orden.update({
      where: { id: ordenId },
      data: { estadoPago: nuevoEstadoPago },
    }),
  ]);

  revalidatePath(`/dashboard/ordenes/${ordenId}`);
  revalidatePath("/dashboard/ordenes");
  return { success: true };
}
