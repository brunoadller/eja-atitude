import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Student, Grade } from '../../types';

export default function AlunoNotas() {
  const { me } = useAuth();
  const a = me!.user as Student;
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    api<Grade[]>(`grades/${a.id}`).then(setGrades);
  }, [a.id]);

  const grouped = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    const key = `${g.subject}__${g.componentModule}__${g.examNumber}`;
    (acc[key] ||= []).push(g);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Minhas Notas" subtitle="Provas e recuperações" />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3">Prova</th>
              <th className="px-4 py-3">Disciplina</th>
              <th className="px-4 py-3">Tentativa</th>
              <th className="px-4 py-3">Nota</th>
              <th className="px-4 py-3">Observação</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(grouped).flatMap((attempts) =>
              attempts.map((g, i) => (
                <tr key={g.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{i === 0 ? g.examNumber : ''}</td>
                  <td className="px-4 py-3">{i === 0 ? `${g.subject}${g.componentModule ? ` (M${g.componentModule})` : ''}` : ''}</td>
                  <td className="px-4 py-3">{g.attempt === 1 ? 'Regular' : `Recuperação ${g.attempt - 1}`}</td>
                  <td className="px-4 py-3">
                    {g.score !== null ? Number(g.score).toFixed(1).replace('.', ',') : (
                      <span className="text-amber-600">
                        Agendada {g.scheduledDate ? `para ${new Date(g.scheduledDate).toLocaleDateString('pt-BR')}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {g.feeCharged && <span className="pill-warning">Taxa de R$30 aplicada</span>}
                  </td>
                </tr>
              ))
            )}
            {!grades.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nenhuma nota lançada ainda</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
