/** Soma meses mantendo o dia (31 -> último dia do mês quando o mês é menor). Usa UTC para não "andar" um dia. */
export function addMonthsClamped(base: Date, months: number): Date {
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + months;
  const day = base.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
}

/** Primeiro dia do mês seguinte (UTC) a partir de uma data. */
export function firstDayOfNextMonth(base: Date): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 1));
}

export function endOfMonthUTC(base: Date): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0, 23, 59, 59));
}

export const fmtDate = (d?: Date | string | null): string =>
  d ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(d)) : '—';

export const fmtMoney = (v: number | string): string =>
  Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
