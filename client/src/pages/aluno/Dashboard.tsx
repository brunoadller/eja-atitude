import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { Student, Invoice, Grade} from '../../types';
import { STATUS_LABEL } from '../../types';
import { StatCard } from '../../components/PageHeader';
import {IoRibbonOutline, IoGridOutline, IoIdCardOutline, IoBookOutline, IoStatsChartOutline, IoWalletOutline, IoCreateOutline, IoDocumentTextOutline
 } from "react-icons/io5";

export default function AlunoDashboard() {
  const { me, refresh } = useAuth();
  const a = me!.user as Student;
  const [notas, setNotas] = useState<Grade[]>([]);
  const [boletos, setBoletos] = useState<Invoice[]>([]);
  const nav = useNavigate();

  // busca a situação atualizada (ex.: virou "Concluído" depois que a secretaria aprovou o último documento)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api<Grade[]>(`grades/${a.id}`).then(setNotas).catch(() => {});
    api<Invoice[]>(`invoices/${a.id}`).then(setBoletos).catch(() => {});
  }, [a.id]);

  const scored = notas.filter((n) => n.score !== null);
  const media = scored.length ? scored.reduce((s, n) => s + Number(n.score), 0) / scored.length : 0;
  const abertos = boletos.filter((b) => b.status !== 'paid').length;

  return (
    <>
      <div className="relative bg-gradient-to-br from-slate-900 to-indigo-600 text-white rounded-xl p-7 mb-6 flex flex-wrap justify-between items-center gap-4 overflow-hidden">
        <div>
          <div className="text-sm opacity-80">Bem-vindo(a) de volta,</div>
          <div className="text-2xl font-bold tracking-tight">{a.name}</div>
          <div className="text-sm opacity-85 mt-1">
            {a.modality || 'EJA'} · Módulo {a.moduleNumber} · {a.classGroup || '—'}
          </div>
        </div>
        <div className="bg-white/15 px-4 py-2 rounded-lg font-mono font-semibold tracking-wider text-sm">
          {a.enrollment}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-7">
        <QuickAction icon={ <IoBookOutline size={30}/>} title="Apostilas" desc="Materiais de estudo" onClick={() => nav('/apostilas')} />
        <QuickAction icon= {<IoStatsChartOutline size={30}/>} title="Minhas Notas" desc="Boletim acadêmico" onClick={() => nav('/notas')} />
        <QuickAction icon= {<IoWalletOutline size={30}/>} title="Meus Boletos" desc="Financeiro" onClick={() => nav('/boletos')} />
        <QuickAction icon= {<IoWalletOutline  size={30}/>} title="Atestado" desc="Comprovante" onClick={() => nav('/secretaria/atestado')} />
        <QuickAction icon={<IoRibbonOutline size={30}/>} title="Certificado" desc="Conclusão" onClick={() => nav('/secretaria/diploma')} />
        <QuickAction icon={<IoCreateOutline size={30}/>} title="Contrato" desc="Ver aceite" onClick={() => nav('/contrato')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Situação"
          value={STATUS_LABEL[a.status] || a.status}
          hint={
            a.status === 'completed'
              ? 'Provas e documentação concluídas'
              : a.status === 'active'
                ? 'Curso em andamento'
                : undefined
          }
        />
        <StatCard
          label="Disciplinas"
          value={new Set(notas.map((n) => n.subject)).size}
          hint="Cursando"
        />
        <StatCard
          label="Média geral"
          value={scored.length ? media.toFixed(2) : '—'}
          hint={scored.length ? (media >= 5 ? 'Acima da média mínima (5,0)' : 'Abaixo da média mínima') : 'Sem notas'}
        />
        <StatCard
          label="Boletos em aberto"
          value={abertos}
          hint={abertos ? 'Verifique pagamentos' : 'Em dia'}
        />
      </div>
    </>
  );
}

function QuickAction({icon,title,desc,onClick,}: {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 text-left flex items-center gap-3 transition hover:border-slate-900 hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="w-10 h-10 rounded-lg bg-indigo-50 grid place-items-center text-xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-slate-500 truncate">{desc}</div>
      </div>
    </button>
  );
}
