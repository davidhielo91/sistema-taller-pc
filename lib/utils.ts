import { prisma } from "./prisma";
import type { EstadoOrden } from "@prisma/client";

export const ESTADO_LABELS: Record<EstadoOrden, string> = {
  RECIBIDO: "Recibido",
  EN_DIAGNOSTICO: "En diagnóstico",
  PRESUPUESTADO: "Presupuestado",
  APROBADO: "Aprobado",
  EN_REPARACION: "En reparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  NO_APROBADO: "No aprobado",
  CANCELADO: "Cancelado",
};

export const TRANSICIONES: Record<EstadoOrden, EstadoOrden[]> = {
  RECIBIDO: ["EN_DIAGNOSTICO", "CANCELADO"],
  EN_DIAGNOSTICO: ["PRESUPUESTADO", "CANCELADO"],
  PRESUPUESTADO: ["APROBADO", "NO_APROBADO", "CANCELADO"],
  APROBADO: ["EN_REPARACION", "CANCELADO"],
  EN_REPARACION: ["LISTO", "CANCELADO"],
  LISTO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  NO_APROBADO: ["ENTREGADO", "CANCELADO"],
  CANCELADO: [],
};

export function esEstadoTerminal(estado: EstadoOrden): boolean {
  return estado === "ENTREGADO" || estado === "CANCELADO";
}

export function ordenEstaAtrasada(
  estado: EstadoOrden,
  fechaPrometida: Date | null
): boolean {
  if (!fechaPrometida) return false;
  if (esEstadoTerminal(estado)) return false;
  return new Date() > fechaPrometida;
}

const MONEDA_LOCALE: Record<string, string> = {
  MXN: "es-MX",
  ARS: "es-AR",
  COP: "es-CO",
  USD: "en-US",
  EUR: "es-ES",
};

function localeDesdeMoneda(moneda: string): string {
  return MONEDA_LOCALE[moneda] ?? "es-MX";
}

export async function getMoneda(): Promise<string> {
  const ajustes = await prisma.ajustes.findUnique({ where: { id: 1 } });
  return ajustes?.moneda ?? "MXN";
}

export function formatDate(date: Date | null | undefined, moneda: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat(localeDesdeMoneda(moneda), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateShort(date: Date | null | undefined, moneda: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat(localeDesdeMoneda(moneda), {
    dateStyle: "short",
  }).format(date);
}

export function formatCurrency(
  amount: number | null | undefined,
  moneda: string
): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat(localeDesdeMoneda(moneda), {
    style: "currency",
    currency: moneda,
  }).format(amount);
}
