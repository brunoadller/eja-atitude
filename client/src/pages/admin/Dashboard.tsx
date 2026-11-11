import { useEffect, useState } from 'react';
import { api, br } from '../../lib/api';
import type { Student} from '../../types';
import PageHeader, { StatCard, StatusPill } from '../../components/PageHeader';

export default function AdminDashboard() {
  const [alunos, setAlunos] = useState<Student[]>([]);

  useEffect(() => {
    api<Student[]>('students').then(setAlunos).catch(() => {});
  }, []);

  const ativos = alunos.filter((a) => a.status === 'active').length;
  const concluidos = alunos.filter((a) => a.status === 'completed').length;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral da plataforma" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Alunos cadastrados" value={alunos.length} hint="Total" />
        <StatCard label="Ativos" value={ativos} hint="Matriculados" />
        <StatCard label="Concluídos" value={concluidos} hint="Prontos p/ certificado" />
        <StatCard label="Aguardando contrato" value={alunos.filter((a) => a.status === 'pending').length} hint="Ainda não ativos" />
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
              {alunos.slice(0, 6).map((a) => (
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
