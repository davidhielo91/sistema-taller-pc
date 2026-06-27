import "server-only";

import { prisma } from "./prisma";
import { localeDesdeMoneda } from "./utils";

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
