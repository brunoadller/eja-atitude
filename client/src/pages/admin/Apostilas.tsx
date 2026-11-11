import { useEffect, useState } from 'react';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, openPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { Book } from '../../types';

export default function AdminApostilas() {
  const toast = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<'' | '1' | '2'>('');
  const [moduleNumber, setModuleNumber] = useState<1 | 2>(1);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');

  const fail = (e: any) => toast(e.message, 'error');
  const load = () => api<Book[]>('books', { params: filter ? { module: filter } : {} }).then(setBooks).catch(fail);

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { api<string[]>('schedule/subjects', { params: { module: moduleNumber } }).then(setSubjects).catch(fail); setSubject(''); }, [moduleNumber]);

  async function add() {
    if (!subject || !fileName.trim()) return toast('Escolha a disciplina e informe o nome do arquivo PDF', 'error');
    try {
      await api('books', {
        method: 'POST',
        body: { title: subject, subject, moduleNumber, description: description || undefined, fileUrl: `/uploads/apostilas/${fileName.trim()}` },
      });
      toast('Apostila cadastrada', 'success');
      setFileName(''); setDescription(''); setSubject('');
      load();
    } catch (e) { fail(e); }
  }

  async function del(b: Book) {
    if (!confirm(`Remover a apostila "${b.title}"?`)) return;
    try { await api(`books/${b.id}`, { method: 'DELETE' }); load(); } catch (e) { fail(e); }
  }

  return (
    <>
      <PageHeader title="Apostilas" subtitle="Cada aluno só enxerga as apostilas do módulo em que está matriculado" />

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-sm mb-3">Nova apostila</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_1fr] gap-3">
          <select className="input" value={moduleNumber} onChange={(e) => setModuleNumber(Number(e.target.value) as 1 | 2)}>
            <option value={1}>Módulo 1 (Livro 1)</option><option value={2}>Módulo 2 (Livro 2)</option>
          </select>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Disciplina…</option>{subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className="input" placeholder="arquivo.pdf (já copiado em server/uploads/apostilas)" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          <input className="input sm:col-span-2" placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="btn-primary" onClick={add}>Cadastrar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sm">Apostilas cadastradas ({books.length})</h3>
          <select className="input w-44" value={filter} onChange={(e) => setFilter(e.target.value as '' | '1' | '2')}>
            <option value="">Todos os módulos</option><option value="1">Módulo 1</option><option value="2">Módulo 2</option>
          </select>
        </div>
        {!books.length ? <Empty icon="📚" title="Nenhuma apostila" desc="Rode npm run seed:apostilas na pasta server para cadastrar as 25 apostilas." /> : (
          <table className="w-full text-sm">
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 w-28"><span className="pill-accent">Módulo {b.moduleNumber ?? '?'}</span></td>
                  <td className="px-4 py-3 font-medium">{b.subject}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{b.fileUrl}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button className="btn-secondary btn-sm" onClick={() => openPdf(`books/${b.id}/download`).catch(fail)}>Abrir</button>
                      <button className="btn-danger btn-sm" onClick={() => del(b)}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
