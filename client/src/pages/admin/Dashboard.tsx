import { br } from '../../lib/api';
import { EMPTY_FILTERS, useStudentList, useStudentsSummary } from '../../lib/students';
import PageHeader, { StatCard, StatusPill } from '../../components/PageHeader';

export default function AdminDashboard() {
  // só os 6 últimos cadastros + os totais (nada de baixar todos os alunos)
  const { items: alunos } = useStudentList(EMPTY_FILTERS, 1, 6);
  const summary = useStudentsSummary();
  const count = (status: string) => summary?.byStatus[status] ?? 0;
  const ativos = count('active');
  const concluidos = count('completed');

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da plataforma" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Alunos cadastrados" value={summary?.total ?? 0} hint="Total" />
        <StatCard label="Ativos" value={ativos} hint="Matriculados" />
        <StatCard label="Concluídos" value={concluidos} hint="Prontos p/ certificado" />
        <StatCard label="Aguardando contrato" value={count('pending')} hint="Ainda não ativos" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sm">Últimos cadastros</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                {['Matrícula', 'Nome', 'Módulo', 'Status', 'Cadastro'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{a.enrollment}</code>
                  </td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3">Módulo {a.moduleNumber}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{br(a.createdAt)}</td>
                </tr>
              ))}
              {!alunos.length && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    Nenhum aluno cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
