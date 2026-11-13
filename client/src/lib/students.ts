import { useCallback, useEffect, useRef, useState } from 'react';
import type { Student } from '../types';
import { api } from './api';
import { useDebounce } from './useDebounce';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Filtros da lista de alunos (strings vazias = filtro desligado). */
export interface StudentFilters {
  search: string;
  status: string;
  moduleNumber: string;
  classGroup: string;
  enrolledFrom: string;
  enrolledTo: string;
}

export const EMPTY_FILTERS: StudentFilters = {
  search: '', status: '', moduleNumber: '', classGroup: '', enrolledFrom: '', enrolledTo: '',
};

export const hasActiveFilters = (f: StudentFilters) => Object.values(f).some(Boolean);

export interface StudentsSummary {
  total: number;
  byStatus: Record<string, number>;
  classGroups: string[];
}

/** Só envia ao servidor os filtros preenchidos. */
const toParams = (f: StudentFilters, page: number, pageSize: number) => ({
  ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')),
  page,
  pageSize,
});

/**
 * Busca uma página de alunos no servidor. A digitação na busca espera 350 ms antes de consultar,
 * e respostas atrasadas (de uma busca antiga) são descartadas.
 */
export function useStudentList(filters: StudentFilters, page: number, pageSize: number) {
  const search = useDebounce(filters.search);
  const [data, setData] = useState<Paginated<Student>>({ items: [], total: 0, page, pageSize });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastRequest = useRef(0);

  const effective = { ...filters, search };
  const key = JSON.stringify([effective, page, pageSize]);

  const load = useCallback(() => {
    const id = ++lastRequest.current;
    setLoading(true);
    api<Paginated<Student>>('students', { params: toParams(effective, page, pageSize) })
      .then((r) => { if (id === lastRequest.current) { setData(r); setError(''); } })
      .catch((e: Error) => { if (id === lastRequest.current) setError(e.message); })
      .finally(() => { if (id === lastRequest.current) setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);

  return { ...data, loading, error, reload: load };
}

/** Totais por situação e lista de turmas (Dashboard e filtro de turma). */
export function useStudentsSummary() {
  const [summary, setSummary] = useState<StudentsSummary | null>(null);
  useEffect(() => { api<StudentsSummary>('students/summary').then(setSummary).catch(() => {}); }, []);
  return summary;
}
