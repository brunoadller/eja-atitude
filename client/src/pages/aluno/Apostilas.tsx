import { useEffect, useState } from 'react';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, openPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { Book } from '../../types';

export default function AlunoApostilas() {
  const [aps, setAps] = useState<Book[]>([]);
  const toast = useToast();
  useEffect(() => { api<Book[]>('books').then(setAps).catch(() => {}); }, []);

  return (
    <>
      <PageHeader title="Apostilas" subtitle="Material de estudo para todas as disciplinas" />
      {!aps.length ? (
        <Empty icon="📚" title="Nenhuma apostila disponível ainda." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aps.map((a) => (
            <div key={a.id} className="card p-5 hover:border-slate-900 hover:shadow-soft transition">
              <span className="pill-accent">
                {a.subject}
                {a.module? ` · ${a.module}` : ''}
              </span>
              <div className="font-semibold mt-3">{a.title}</div>
              <div className="text-sm text-slate-500 mt-1 min-h-[40px]">{a.description || ''}</div>
              <button className="btn-primary btn-sm mt-4 inline-flex" onClick={() => openPdf(`books/${a.id}/download`).catch((e) => toast(e.message, 'error'))}>
                Acessar apostila
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
