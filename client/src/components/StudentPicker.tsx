import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Paginated } from '../lib/students';
import { useDebounce } from '../lib/useDebounce';
import type { Student } from '../types';

/**
 * Escolha de um aluno por busca (nome, matrícula ou CPF), no lugar de um <select> com todos.
 * Sem texto digitado, mostra os últimos matriculados. Devolve o aluno inteiro em onChange.
 */
export default function StudentPicker({
  value, onChange,
}: {
  value: Student | null;
  onChange: (s: Student | null) => void;
}) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const search = useDebounce(text.trim(), 300);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false; // ignora respostas de buscas antigas
    setLoading(true);
    api<Paginated<Student>>('students', { params: { ...(search && { search }), pageSize: 8 } })
      .then((r) => { if (!cancelled) { setResults(r.items); setError(''); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, open]);

  // fecha ao clicar fora
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function pick(s: Student) {
    onChange(s);
    setOpen(false);
    setText('');
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 max-w-md">
        <div className="input flex-1 truncate">{value.enrollment} — {value.name}</div>
        <button className="btn-secondary btn-sm" onClick={() => { onChange(null); setOpen(true); }}>Trocar aluno</button>
      </div>
    );
  }

  return (
    <div ref={box} className="relative max-w-md w-full">
      <input
        className="input"
        type="search"
        placeholder="Buscar aluno por nome, matrícula ou CPF…"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-auto">
          {error && <li className="px-3 py-2 text-sm text-red-600">{error}</li>}
          {!error && loading && !results.length && <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>}
          {!error && !loading && !results.length && <li className="px-3 py-2 text-sm text-slate-500">Nenhum aluno encontrado.</li>}
          {results.map((s) => (
            <li key={s.id}>
              <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50" onClick={() => pick(s)}>
                <span className="font-medium">{s.name}</span>
                <span className="block text-xs text-slate-500">{s.enrollment} · Módulo {s.moduleNumber}{s.classGroup ? ` · ${s.classGroup}` : ''}</span>
              </button>
            </li>
          ))}
          {!search && results.length === 8 && <li className="px-3 py-2 text-xs text-slate-500 border-t border-slate-100">Mostrando os mais recentes. Digite para buscar.</li>}
        </ul>
      )}
    </div>
  );
}
