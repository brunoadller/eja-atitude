import { useEffect, useState } from 'react';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, br, money } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Invoice, Student } from '../../types';

export default function AlunoBoletos() {
  const { me } = useAuth();
  const a = me!.user as Student;
  const [boletos, setBoletos] = useState<Invoice[]>([]);

  useEffect(() => { api<Invoice[]>(`invoices/${a.id}`).then(setBoletos).catch(() => {}); }, [a.id]);

  const parcelas = boletos.filter((b) => b.kind === 'installment');
  const pagas = parcelas.filter((b) => b.status === 'paid').length;

  return (
    <>
      <PageHeader title="Meus Boletos" subtitle="Parcelas da matrícula. O pagamento é feito na secretaria, que dá baixa aqui." />
      {!boletos.length ? (
        <div className="card"><Empty icon="🏦" title="Nenhuma parcela gerada ainda." /></div>
      ) : (
        <>
          {parcelas.length > 0 && <div className="mb-4 text-sm text-slate-600"><strong>{pagas}</strong> de <strong>{parcelas.length}</strong> parcelas pagas</div>}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  {['Parcela', 'Valor', 'Vencimento', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boletos.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{b.kind === 'installment' ? `${b.installmentNumber} de ${b.installmentTotal}` : b.reference}</td>
                    <td className="px-4 py-3">{money(b.amount)}</td>
                    <td className="px-4 py-3">{br(b.dueDate)}</td>
                    <td className="px-4 py-3">
                      {b.status === 'paid' ? <span className="pill-success">Pago{b.paidAt ? ` em ${br(b.paidAt)}` : ''}</span> : <span className="pill-warning">Em aberto</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
