/**
 * Modelo "Cronograma EJA Etapa II 2026/2" (transcrito do cronograma da escola).
 * Cada linha: [data, [[disciplina, módulo da disciplina], ...]]. "PROVA" marca o dia de provas.
 */
type Item = [string, number];
type Day = { date: string; items?: Item[]; exam?: true };

const P = 'Língua Portuguesa', M = 'Matemática', MF = 'Matemática Financeira';

export const TEMPLATE_2026_2: Day[] = [
  { date: '2026-08-28', items: [[P, 6], [P, 6], ['Geografia', 4], ['Artes', 3]] },
  { date: '2026-09-04', items: [['Biologia', 4], ['Química', 4], [M, 6], [M, 6]] },
  { date: '2026-09-11', exam: true },
  { date: '2026-09-18', items: [['Física', 4], ['Física', 4], ['Sociologia', 3], ['Sociologia', 4]] },
  { date: '2026-09-25', items: [['Biologia', 5], ['Química', 5], [M, 7], [M, 7]] },
  { date: '2026-10-02', exam: true },
  { date: '2026-10-09', items: [[P, 7], [P, 7], ['História', 4], ['Artes', 4]] },
  { date: '2026-10-16', items: [[M, 8], [M, 8], [P, 8], [P, 8]] },
  { date: '2026-10-23', exam: true },
  { date: '2026-10-30', items: [['Geografia', 5], ['Geografia', 5], ['Física', 5], ['Física', 5]] },
  { date: '2026-11-06', items: [[M, 9], [M, 9], ['História', 5], ['História', 6]] },
  { date: '2026-11-13', exam: true },
  { date: '2026-11-23', items: [[P, 9], [P, 9], ['Filosofia', 3], ['Filosofia', 4]] },
  { date: '2026-11-27', items: [[P, 10], [P, 10], ['LEM Inglês', 3], ['LEM Inglês', 4]] },
  { date: '2026-12-04', exam: true },
  { date: '2026-12-11', items: [[M, 10], [M, 10], ['Geografia', 6], ['Geografia', 6]] },
  { date: '2026-12-18', items: [['Projeto de Vida', 3], ['Projeto de Vida', 4], [MF, 3], ['Física', 6]] },
  { date: '2026-12-21', exam: true },
  { date: '2027-01-08', items: [['Biologia', 6], ['Química', 6], [MF, 4], [MF, 4]] },
  { date: '2027-01-15', exam: true },
];
