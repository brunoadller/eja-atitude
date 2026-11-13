import { useEffect, useState } from 'react';
import PageHeader, { Empty, StatusPill } from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { api, openPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import type { Student } from '../../types';
import StudentForm from './StudentForm';

export default function AdminAlunos() {
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [advancing, setAdvancing] = useState<Student | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = () => api<Student[]>('students').then(setAlunos).catch(() => {});
  useEffect(() => { load(); }, []);

  async function excluir(a: Student) {
    const ok = await confirm({
      title: 'Excluir aluno',
      message: `Excluir ${a.name}? As notas, parcelas e documentos dele também serão apagados.`,
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`students/${a.id}`, { method: 'DELETE' });
      toast('Aluno excluído', 'success');
      load();
    } catch (e: any) { toast(e.message, 'error'); }
  }

  const act = (fn: () => Promise<void>) => fn().catch((e: any) => toast(e.message, 'error'));

  return (
    <>
      <PageHeader
        title="Alunos"
        subtitle="Cadastro e gestão de matrículas"
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ Nova matrícula</button>}
      />

      <div className="card">
        {!alunos.length ? (
          <Empty icon="👤" title="Nenhum aluno cadastrado" desc='Clique em "Nova matrícula" para começar.' />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  {['Matrícula', 'Nome', 'CPF', 'Módulo', 'Turma', 'Status', 'Ações'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-neutral-50">
                    <td className="px-4 py-3"><code className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{a.enrollment}</code></td>
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.cpf || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">Módulo {a.moduleNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{a.classGroup || '—'}</td>
                    <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button className="btn-secondary btn-sm" onClick={() => { setEditing(a); setShowForm(true); }}>Editar</button>
                        <button
                          className="btn-secondary btn-sm"
                          disabled={a.status !== 'active'}
                          title={a.status === 'active' ? undefined : a.status === 'completed' ? 'Curso concluído: emita o certificado' : 'Atestado só para aluno ativo'}
                          onClick={() => act(() => openPdf(`certificates/enrollment/${a.id}`))}
                        >
                          Atestado
                        </button>
                        <button className="btn-secondary btn-sm" onClick={() => act(() => openPdf(`invoices/student/${a.id}/carne`))}>Carnê</button>
                        {a.moduleNumber === 1 && (
                          <button className="btn-secondary btn-sm" onClick={() => setAdvancing(a)}>Ativar módulo 2</button>
                        )}
                        <button className="btn-danger btn-sm" onClick={() => excluir(a)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <StudentForm student={editing} onClose={() => setShowForm(false)} onSaved={load} />}
      {advancing && <AdvanceModule student={advancing} onClose={() => setAdvancing(null)} onSaved={load} />}
    </>
  );
}

function AdvanceModule({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [fee, setFee] = useState(String(student.monthlyFee ?? 199));
  const [n, setN] = useState('6');
  const [due, setDue] = useState('');

  async function save() {
    try {
      await api(`students/${student.id}/advance-module`, {
        method: 'POST',
        body: { monthlyFee: Number(fee), installments: Number(n), firstDueDate: due },
      });
      toast('Módulo 2 ativado: aluno recebe as apostilas do módulo 2 e novas parcelas foram geradas', 'success');
      onSaved();
      onClose();
    } catch (e: any) { toast(e.message, 'error'); }
  }

  return (
    <Modal title={`Ativar Módulo 2 — ${student.name}`} onClose={onClose}>
      <div className="p-6 grid gap-3">
        <p className="text-sm text-slate-500">O aluno passa a ver as apostilas e o cronograma do módulo 2. Informe as novas parcelas.</p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Valor da parcela (R$)</label><input className="input" type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
          <div><label className="label">Nº de parcelas</label><input className="input" type="number" min={1} max={24} value={n} onChange={(e) => setN(e.target.value)} /></div>
          <div><label className="label">1º vencimento</label><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!due || !(Number(fee) > 0)} onClick={save}>Ativar módulo 2</button>
        </div>
      </div>
    </Modal>
  );
}
