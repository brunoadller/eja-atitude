import { useEffect, useState } from 'react';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, br } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { Grade, ScheduleData, Student } from '../../types';

const yearOf = (s: Student) => new Date(s.enrollmentDate || Date.now()).getUTCFullYear();

export default function AdminNotas() {
  const toast = useToast();
  const [alunos, setAlunos] = useState<Student[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sched, setSched] = useState<ScheduleData | null>(null);
  const [round, setRound] = useState('');
  const [item, setItem] = useState('');
  const [score, setScore] = useState('');
  const [recDate, setRecDate] = useState<Record<string, string>>({});
  const [recScore, setRecScore] = useState<Record<string, string>>({});

  const fail = (e: any) => toast(e.message, 'error');
  const aluno = alunos.find((a) => a.id === alunoId);
  const loadGrades = () => api<Grade[]>(`grades/${alunoId}`).then(setGrades).catch(fail);

  useEffect(() => { api<Student[]>('students').then(setAlunos).catch(fail); }, []);
  useEffect(() => {
    setRound(''); setItem(''); setSched(null);
    if (!aluno) return setGrades([]);
    loadGrades();
    api<ScheduleData>('schedule/group', { params: { module: aluno.moduleNumber, year: yearOf(aluno) } }).then(setSched).catch(fail);
  }, [alunoId]);

  const roundItems = sched?.rounds.find((r) => String(r.roundNumber) === round)?.items ?? [];

  async function lancar() {
    const it = roundItems.find((i) => i.id === item);
    if (!it || score === '') return toast('Escolha a prova, a disciplina e a nota', 'error');
    try {
      await api('grades/regular', { method: 'POST', body: { studentId: alunoId, examNumber: Number(round), subject: it.subject, componentModule: it.componentModule, score: Number(score.replace(',', '.')) } });
      toast('Nota lançada', 'success');
      setScore(''); setItem('');
      loadGrades();
    } catch (e) { fail(e); }
  }

  const agendar = async (g: Grade) => {
    try {
      await api('grades/recovery/schedule', { method: 'POST', body: { studentId: alunoId, subject: g.subject, componentModule: g.componentModule, scheduledDate: recDate[g.id] } });
      toast(g.attempt + 1 >= 3 ? 'Recuperação agendada — taxa de R$ 30 gerada em Boletos' : 'Recuperação agendada', 'success');
      loadGrades();
    } catch (e) { fail(e); }
  };
  const lancarRec = async (g: Grade) => {
    try { await api(`grades/recovery/${g.id}/score`, { method: 'PUT', body: { score: Number((recScore[g.id] || '').replace(',', '.')) } }); loadGrades(); } catch (e) { fail(e); }
  };
  const remover = async (g: Grade) => {
    if (!confirm('Remover este lançamento?')) return;
    try { await api(`grades/${g.id}`, { method: 'DELETE' }); loadGrades(); } catch (e) { fail(e); }
  };

  // última tentativa de cada disciplina/módulo e se já passou
  const lastOf = (g: Grade) => grades.filter((x) => x.subject === g.subject && x.componentModule === g.componentModule).sort((a, b) => b.attempt - a.attempt)[0];
  const passed = (g: Grade) => grades.some((x) => x.subject === g.subject && x.componentModule === g.componentModule && x.score !== null && Number(x.score) >= 5);

  return (
    <>
      <PageHeader title="Notas" subtitle="Lançamento das 7 provas e recuperações (média mínima 5,0 · 1 prova + 1 recuperação; taxa de R$ 30 a partir da 2ª recuperação)" />
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-sm">Aluno</h3>
          <select className="input max-w-md" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
            <option value="">Selecione um aluno…</option>
            {alunos.map((a) => <option key={a.id} value={a.id}>{a.enrollment} — {a.name}</option>)}
          </select>
        </div>
        <div className="p-6">
          {!aluno ? <Empty icon="📝" title="Selecione um aluno" /> : (
            <>
              {aluno.status === 'pending' && <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">Este aluno ainda não aceitou o contrato.</div>}
              {sched && !sched.rounds.length && <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">Nenhuma prova cadastrada para {sched.classGroup}. Cadastre em <strong>Cronograma</strong>.</div>}

              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px_auto] gap-2 mb-6">
                <select className="input" value={round} onChange={(e) => { setRound(e.target.value); setItem(''); }}>
                  <option value="">Prova…</option>
                  {sched?.rounds.map((r) => <option key={r.id} value={r.roundNumber}>Prova {r.roundNumber} · {br(r.examDate)}</option>)}
                </select>
                <select className="input" value={item} onChange={(e) => setItem(e.target.value)} disabled={!round}>
                  <option value="">Disciplina (módulo)…</option>
                  {roundItems.map((i) => <option key={i.id} value={i.id}>{i.subject} — M{i.componentModule}</option>)}
                </select>
                <input className="input" inputMode="decimal" placeholder="Nota" value={score} onChange={(e) => setScore(e.target.value)} />
                <button className="btn-primary" onClick={lancar}>Lançar prova</button>
              </div>

              {!grades.length ? <Empty icon="📝" title="Nenhuma nota lançada" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-neutral-50">{['Prova', 'Disciplina', 'Tentativa', 'Nota', 'Ações'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {grades.map((g) => {
                        const isLast = lastOf(g)?.id === g.id;
                        const low = g.score !== null && Number(g.score) < 5;
                        return (
                          <tr key={g.id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-3">{g.examNumber}ª</td>
                            <td className="px-4 py-3 font-medium">{g.subject}{g.componentModule ? ` (M${g.componentModule})` : ''}</td>
                            <td className="px-4 py-3">{g.attempt === 1 ? 'Regular' : `Recuperação ${g.attempt - 1}`}{g.feeCharged && <span className="pill-warning ml-2">taxa R$ 30</span>}</td>
                            <td className="px-4 py-3">
                              {g.score !== null ? <span className={low ? 'text-red-600 font-semibold' : 'font-semibold'}>{Number(g.score).toFixed(1).replace('.', ',')}</span> : (
                                <div className="flex gap-1.5 items-center">
                                  <span className="text-amber-600 text-xs">agendada {br(g.scheduledDate)}</span>
                                  <input className="input w-20" placeholder="Nota" value={recScore[g.id] || ''} onChange={(e) => setRecScore({ ...recScore, [g.id]: e.target.value })} />
                                  <button className="btn-secondary btn-sm" onClick={() => lancarRec(g)}>Lançar</button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {isLast && low && !passed(g) && (
                                  <>
                                    <input type="date" className="input w-40" value={recDate[g.id] || ''} onChange={(e) => setRecDate({ ...recDate, [g.id]: e.target.value })} />
                                    <button className="btn-secondary btn-sm" disabled={!recDate[g.id]} onClick={() => agendar(g)}>Agendar recuperação</button>
                                  </>
                                )}
                                <button className="btn-danger btn-sm" onClick={() => remover(g)}>Remover</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
