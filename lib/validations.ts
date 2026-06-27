import { z } from "zod";
import { EstadoOrden } from "@prisma/client";

export const ClienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  telefono: z.string().nullable().optional(),
  email: z.string().email("Correo inválido").nullable().optional().or(z.literal("")),
  documento: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
});

export type ClienteInput = z.infer<typeof ClienteSchema>;

export const OrdenSchema = z.object({
  clienteId: z.string().min(1, "Debe seleccionar un cliente"),
  tipoEquipo: z.string().min(1, "El tipo de equipo es requerido"),
  marca: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  serie: z.string().nullable().optional(),
  accesorios: z.string().nullable().optional(),
  fallaReportada: z.string().min(1, "La falla reportada es requerida"),
  estadoFisico: z.string().nullable().optional(),
  notasRecepcion: z.string().nullable().optional(),
  contrasenaEquipo: z.string().nullable().optional(),
  fechaPrometida: z.string().nullable().optional(),
});

export type OrdenInput = z.infer<typeof OrdenSchema>;

export const CambioEstadoSchema = z.object({
  ordenId: z.string(),
  nuevoEstado: z.nativeEnum(EstadoOrden),
  trabajoRealizado: z.string().nullable().optional(),
  notasEntrega: z.string().nullable().optional(),
  costo: z.number().nullable().optional(),
});

export type CambioEstadoInput = z.infer<typeof CambioEstadoSchema>;
