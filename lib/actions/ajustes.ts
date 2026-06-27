"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const AjustesSchema = z.object({
  nombreTaller: z.string().min(1, "El nombre es requerido"),
  moneda: z.string().min(1, "La moneda es requerida"),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  codigoPaisWhatsapp: z.string().nullable().optional(),
  mensajeWhatsappListo: z.string().nullable().optional(),
});

export async function getAjustes() {
  await verifySession();
  return prisma.ajustes.findUnique({ where: { id: 1 } });
}

export async function updateAjustes(formData: FormData) {
  const session = await verifySession();
  if (session.rol !== "ADMIN") {
    return { message: "Solo administradores pueden modificar ajustes" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = AjustesSchema.safeParse({
    ...raw,
    telefono: raw.telefono || null,
    direccion: raw.direccion || null,
    logoUrl: raw.logoUrl || null,
    codigoPaisWhatsapp: raw.codigoPaisWhatsapp || null,
    mensajeWhatsappListo: raw.mensajeWhatsappListo || null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.ajustes.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  revalidatePath("/dashboard/ajustes");
  return { success: true };
}
