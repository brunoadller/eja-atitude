import { useEffect, useState } from 'react';
import { IoWalletOutline } from 'react-icons/io5';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, br, money, openPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import type { Invoice, Student } from '../../types';

export default function AdminBoletos() {
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [boletos, setBoletos] = useState<Invoice[]>([]);
  const [valor, setValor] = useState('199');
  const [n, setN] = useState('6');
  const [venc, setVenc] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  const fail = (e: any) => toast(e.message, 'error');
  const loadInvoices = (id = alunoId) => api<Invoice[]>(`invoices/${id}`).then(setBoletos).catch(fail);

  useEffect(() => { api<Student[]>('students').then(setAlunos).catch(fail); }, []);
  useEffect(() => {
    if (!alunoId) return setBoletos([]);
    loadInvoices(alunoId);
    const a = alunos.find((x) => x.id === alunoId);
    if (a?.monthlyFee) setValor(String(a.monthlyFee));
  }, [alunoId]);

  const parcelas = boletos.filter((b) => b.kind === 'installment');
  const taxas = boletos.filter((b) => b.kind === 'fee');
  const pagas = parcelas.filter((b) => b.status === 'paid').length;

  async function gerarParcelas() {
    try {
      await api('invoices/installments', { method: 'POST', body: { studentId: alunoId, amount: Number(valor), installments: Number(n), firstDueDate: venc } });
      toast('Parcelas geradas', 'success');
      loadInvoices();
    } catch (e) { fail(e); }
  }
  async function pagar(id: string) {
    try { await api(`invoices/${id}/pay`, { method: 'POST' }); toast('Marcado como pago', 'success'); loadInvoices(); } catch (e) { fail(e); }
  }
  async function reabrir(id: string) {
    const ok = await confirm({
      title: 'Reabrir boleto',
      message: 'Reabrir este boleto (desfazer o pagamento)?',
      confirmLabel: 'Reabrir boleto',
    });
    if (!ok) return;
    try { await api(`invoices/${id}/reopen`, { method: 'POST' }); loadInvoices(); } catch (e) { fail(e); }
  }

  const Row = ({ b }: { b: Invoice }) => (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 font-medium">{b.kind === 'installment' ? `${b.installmentNumber} de ${b.installmentTotal}` : b.reference}</td>
      <td className="px-4 py-3">{money(b.amount)}</td>
      <td className="px-4 py-3">{br(b.dueDate)}</td>
      <td className="px-4 py-3">
        {b.status === 'paid' ? <span className="pill-success">Pago {b.paidAt ? `em ${br(b.paidAt)}` : ''}</span> : <span className="pill-warning">Em aberto</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          <button className="btn-secondary btn-sm" onClick={() => openPdf(`invoices/${b.id}/pdf`).catch(fail)}>3 vias (PDF)</button>
          {b.status !== 'paid'
            ? <button className="btn-secondary btn-sm" onClick={() => pagar(b.id)}>Marcar pago</button>
            : <button className="btn-ghost btn-sm" onClick={() => reabrir(b.id)}>Desfazer</button>}
        </div>
      </td>
    </tr>
  );

  const Head = () => (
    <thead>
      <tr className="bg-neutral-50">
        {['Parcela / Ref.', 'Valor', 'Vencimento', 'Status', 'Ações'].map((h) => (
          <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <>
      <PageHeader title="Boletos" subtitle="Parcelas, pagamentos e carnê (3 vias por parcela)" />
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sm">Aluno</h3>
          <select className="input max-w-md" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
            <option value="">Selecione um aluno…</option>
            {alunos.map((a) => <option key={a.id} value={a.id}>{a.enrollment} — {a.name}</option>)}
          </select>
        </div>
        <div className="p-6">
          {!alunoId ? (
            <Empty icon={<IoWalletOutline className="text-slate-900" size={50} />} title="Selecione um aluno" />
          ) : (
            <>
              {!parcelas.length ? (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm font-medium mb-3">Este aluno ainda não tem parcelas. Gere agora:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <input type="number" step="0.01" className="input" placeholder="Valor da parcela" value={valor} onChange={(e) => setValor(e.target.value)} />
                    <input type="number" min={1} max={24} className="input" placeholder="Nº de parcelas" value={n} onChange={(e) => setN(e.target.value)} />
                    <input type="date" className="input" value={venc} onChange={(e) => setVenc(e.target.value)} />
                    <button className="btn-primary" disabled={!venc} onClick={gerarParcelas}>Gerar parcelas</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="text-sm text-slate-600"><strong>{pagas}</strong> de <strong>{parcelas.length}</strong> parcelas pagas</div>
                  <div className="flex gap-2">
                    <button className="btn-primary btn-sm" onClick={() => openPdf(`invoices/student/${alunoId}/carne`).catch(fail)}>Imprimir carnê completo</button>
                    <button className="btn-secondary btn-sm" onClick={() => openPdf(`invoices/student/${alunoId}/carne?onlyOpen=1`).catch(fail)}>Só as em aberto</button>
                  </div>
                </div>
              )}

              {parcelas.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><Head /><tbody>{parcelas.map((b) => <Row key={b.id} b={b} />)}</tbody></table></div>}

              {taxas.length > 0 && (
                <>
                  <h4 className="font-semibold text-sm mt-8 mb-2">Taxas (2ª via, recuperação)</h4>
                  <div className="overflow-x-auto"><table className="w-full text-sm"><Head /><tbody>{taxas.map((b) => <Row key={b.id} b={b} />)}</tbody></table></div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
