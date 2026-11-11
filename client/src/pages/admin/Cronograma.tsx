import { useEffect, useMemo, useState } from 'react';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, br, openPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { ScheduleData } from '../../types';

type Row = { subject: string; componentModule: string };
const emptyRow = (): Row => ({ subject: '', componentModule: '' });
const Mselect = ({ v, on }: { v: string; on: (v: string) => void }) => (
  <select className="input w-28" value={v} onChange={(e) => on(e.target.value)}>
    <option value="">Módulo</option>
    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>M{i + 1}</option>)}
  </select>
);

export default function AdminCronograma() {
  const toast = useToast();
  const [moduleNumber, setModuleNumber] = useState<1 | 2>(2);
  const [year, setYear] = useState(2026);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [data, setData] = useState<ScheduleData | null>(null);

  const [dayDate, setDayDate] = useState('');
  const [dayRows, setDayRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [roundNumber, setRoundNumber] = useState('');
  const [roundDate, setRoundDate] = useState('');
  const [roundRows, setRoundRows] = useState<Row[]>([]);

  const fail = (e: any) => toast(e.message, 'error');
  const load = () =>
    api<ScheduleData>('schedule/group', { params: { module: moduleNumber, year } }).then(setData).catch(fail);

  useEffect(() => { api<string[]>('schedule/subjects', { params: { module: moduleNumber } }).then(setSubjects).catch(fail); }, [moduleNumber]);
  useEffect(() => { load(); }, [moduleNumber, year]);

  const rowsToItems = (rows: Row[]) =>
    rows.filter((r) => r.subject && r.componentModule).map((r) => ({ subject: r.subject, componentModule: Number(r.componentModule) }));

  async function addDay() {
    const items = rowsToItems(dayRows);
    if (!dayDate || !items.length) return toast('Informe a data e ao menos uma disciplina com o módulo', 'error');
    try {
      await api('schedule/class-days', { method: 'POST', body: { moduleNumber, year, date: dayDate, items } });
      toast('Dia de aula cadastrado', 'success');
      setDayRows([emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
      load();
    } catch (e) { fail(e); }
  }

  async function addRound() {
    if (!roundNumber || !roundDate) return toast('Escolha o número da prova e a data', 'error');
    try {
      const items = rowsToItems(roundRows);
      await api('schedule/exam-rounds', { method: 'POST', body: { moduleNumber, year, roundNumber: Number(roundNumber), examDate: roundDate, items: items.length ? items : undefined } });
      toast('Prova cadastrada', 'success');
      setRoundNumber(''); setRoundDate(''); setRoundRows([]);
      load();
    } catch (e) { fail(e); }
  }

  async function importTemplate() {
    try { await api('schedule/import-template', { method: 'POST', body: { moduleNumber, year } }); toast('Cronograma modelo importado (aulas + 7 provas)', 'success'); load(); } catch (e) { fail(e); }
  }
  const del = async (path: string) => { try { await api(path, { method: 'DELETE' }); load(); } catch (e) { fail(e); } };

  const usedRounds = new Set(data?.rounds.map((r) => r.roundNumber));
  const timeline = useMemo(() => {
    if (!data) return [];
    const days = new Map<string, { date: string; sessions: typeof data.sessions; round?: (typeof data.rounds)[number] }>();
    for (const s of data.sessions) { const k = s.date.slice(0, 10); (days.get(k) ?? days.set(k, { date: s.date, sessions: [] }).get(k)!).sessions.push(s); }
    for (const r of data.rounds) { const k = r.examDate.slice(0, 10); (days.get(k) ?? days.set(k, { date: r.examDate, sessions: [] }).get(k)!).round = r; }
    return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const RowsEditor = ({ rows, setRows, max }: { rows: Row[]; setRows: (r: Row[]) => void; max: number }) => (
    <div className="grid gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <select className="input flex-1" value={r.subject} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))}>
            <option value="">Disciplina…</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Mselect v={r.componentModule} on={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, componentModule: v } : x)))} />
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {rows.length < max && <button type="button" className="btn-secondary btn-sm w-fit" onClick={() => setRows([...rows, emptyRow()])}>+ disciplina</button>}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Cronograma"
        subtitle="Aulas e as 7 provas de cada módulo — aparece no portal do aluno que já aceitou o contrato"
        actions={<button className="btn-secondary" onClick={() => openPdf(`schedule/group/pdf?module=${moduleNumber}&year=${year}`).catch(fail)}>Baixar PDF</button>}
      />

      <div className="card p-4 mb-5 flex flex-wrap items-end gap-3">
        <div><label className="label">Módulo</label>
          <select className="input" value={moduleNumber} onChange={(e) => setModuleNumber(Number(e.target.value) as 1 | 2)}>
            <option value={1}>Módulo 1 (1º semestre)</option><option value={2}>Módulo 2 (2º semestre)</option>
          </select></div>
        <div><label className="label">Ano</label><input className="input w-28" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
        <div className="text-sm text-slate-500 pb-2">Turma: <strong>{data?.classGroup}</strong> · disciplinas do módulo {moduleNumber}: {subjects.length}</div>
        {moduleNumber === 2 && year === 2026 && data && !data.sessions.length && !data.rounds.length && (
          <button className="btn-primary ml-auto" onClick={importTemplate}>Importar cronograma modelo 2026/2</button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-3">Novo dia de aula</h3>
          <label className="label">Data</label>
          <input type="date" className="input mb-3 max-w-[200px]" value={dayDate} onChange={(e) => setDayDate(e.target.value)} />
          <RowsEditor rows={dayRows} setRows={setDayRows} max={8} />
          <button className="btn-primary mt-4" onClick={addDay}>Salvar dia de aula</button>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-3">Nova prova</h3>
          <div className="flex gap-3 mb-3">
            <div><label className="label">Prova nº</label>
              <select className="input w-28" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n} disabled={usedRounds.has(n)}>{n}ª{usedRounds.has(n) ? ' (já cadastrada)' : ''}</option>)}
              </select></div>
            <div><label className="label">Data</label><input type="date" className="input" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} /></div>
          </div>
          <p className="text-xs text-slate-500 mb-2">Deixe a lista vazia para usar as disciplinas das aulas dadas desde a prova anterior, ou adicione manualmente:</p>
          <RowsEditor rows={roundRows} setRows={setRoundRows} max={30} />
          <button className="btn-primary mt-4" onClick={addRound}>Salvar prova</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-sm">Cronograma cadastrado</h3></div>
        {!timeline.length ? <Empty icon="🗓️" title="Nenhum item cadastrado" desc="Cadastre os dias de aula e as provas acima." /> : (
          <table className="w-full text-sm">
            <tbody>
              {timeline.map((d) => (
                <tr key={d.date} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium w-36">{br(d.date)}</td>
                  <td className="px-4 py-3">
                    {d.sessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 py-0.5">
                        <span>{s.subject}{s.componentModule ? ` ${s.componentModule}` : ''}</span>
                        <button className="text-slate-400 hover:text-red-600 text-xs" onClick={() => del(`schedule/class-sessions/${s.id}`)}>remover</button>
                      </div>
                    ))}
                    {d.round && (
                      <div className="flex items-start gap-2">
                        <span className="pill-accent">Prova {d.round.roundNumber}</span>
                        <span className="text-slate-600 text-xs">{d.round.items.map((i) => `${i.subject} ${i.componentModule ?? ''}`).join(' · ')}</span>
                        <button className="text-slate-400 hover:text-red-600 text-xs" onClick={() => del(`schedule/exam-rounds/${d.round!.id}`)}>remover</button>
                      </div>
                    )}
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
