import { ModuleNumber } from './curriculum';

export interface AcademicPeriod {
  label: string;    // "2026/2"
  startDate: Date;  // início das aulas
  endDate: Date;    // término do período
  startClasses: string; // dd/mm/aaaa
  endClasses: string;
}

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day));
const f = (dt: Date) =>
  `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}/${dt.getUTCFullYear()}`;

/**
 * Calendário do período letivo.
 * 2026 vem dos documentos da escola (módulo 1: 20/03–21/08/2026; módulo 2: 28/08/2026–22/01/2027).
 * Para outros anos usa as mesmas datas (ajuste aqui quando o calendário mudar).
 */
export function getPeriod(year: number, moduleNumber: ModuleNumber): AcademicPeriod {
  const [start, end] =
    moduleNumber === 1 ? [d(year, 3, 20), d(year, 8, 21)] : [d(year, 8, 28), d(year + 1, 1, 22)];
  return { label: `${year}/${moduleNumber}`, startDate: start, endDate: end, startClasses: f(start), endClasses: f(end) };
}
