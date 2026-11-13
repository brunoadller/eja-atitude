import { EMPTY_FILTERS, hasActiveFilters, StudentFilters as Filters } from '../lib/students';
import { STATUS_LABEL } from '../types';

/** Barra de filtros da lista de alunos: busca (nome, matrícula ou CPF), situação, módulo, turma e data de matrícula. */
export default function StudentFilters({
  filters, onChange, classGroups = [],
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  classGroups?: string[];
}) {
  const set = (k: keyof Filters, v: string) => onChange({ ...filters, [k]: v });

  return (
    <div className="p-4 border-b border-slate-100 grid gap-3">
      <input
        className="input"
        type="search"
        placeholder="Buscar por nome, matrícula ou CPF…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
      />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        <select className="input" value={filters.status} onChange={(e) => set('status', e.target.value)} aria-label="Situação">
          <option value="">Todas as situações</option>
          {Object.entries(STATUS_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <select className="input" value={filters.moduleNumber} onChange={(e) => set('moduleNumber', e.target.value)} aria-label="Módulo">
          <option value="">Todos os módulos</option>
          <option value="1">Módulo 1</option>
          <option value="2">Módulo 2</option>
        </select>
        <select className="input" value={filters.classGroup} onChange={(e) => set('classGroup', e.target.value)} aria-label="Turma">
          <option value="">Todas as turmas</option>
          {classGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="text-xs text-slate-500 grid gap-0.5">
          Matrícula de
          <input type="date" className="input" value={filters.enrolledFrom} onChange={(e) => set('enrolledFrom', e.target.value)} />
        </label>
        <label className="text-xs text-slate-500 grid gap-0.5">
          Matrícula até
          <input type="date" className="input" value={filters.enrolledTo} onChange={(e) => set('enrolledTo', e.target.value)} />
        </label>
        <div className="flex items-end">
          {hasActiveFilters(filters) && (
            <button className="btn-ghost btn-sm" onClick={() => onChange(EMPTY_FILTERS)}>Limpar filtros</button>
          )}
        </div>
      </div>
    </div>
  );
}
