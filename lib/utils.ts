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

export function localeDesdeMoneda(moneda: string): string {
  return MONEDA_LOCALE[moneda] ?? "es-MX";
}

export type EstadoPagoValue = "PENDIENTE" | "ABONADO" | "PAGADO";

export const ESTADO_PAGO_LABELS: Record<EstadoPagoValue, string> = {
  PENDIENTE: "Sin pagar",
  ABONADO: "Abonado",
  PAGADO: "Pagado",
};

export function calcularEstadoPago(
  costo: number | null | undefined,
  totalPagado: number
): EstadoPagoValue {
  if (costo == null) return "PENDIENTE";
  if (totalPagado <= 0) return "PENDIENTE";
  if (totalPagado >= costo) return "PAGADO";
  return "ABONADO";
}
