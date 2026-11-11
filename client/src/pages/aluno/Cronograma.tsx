import { useEffect, useMemo, useState } from 'react';
import PageHeader, { Empty } from '../../components/PageHeader';
import { api, br, downloadPdf } from '../../lib/api';
import { useToast } from '../../lib/toast';
import type { ScheduleData } from '../../types';

export default function AlunoCronograma() {
  const toast = useToast();
  const [data, setData] = useState<ScheduleData | null>(null);

  useEffect(() => { api<ScheduleData>('schedule/me').then(setData).catch((e) => toast(e.message, 'error')); }, []);

  const days = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { date: string; lines: string[]; round?: number }>();
    for (const s of data.sessions) {
      const k = s.date.slice(0, 10);
      const d = map.get(k) ?? { date: s.date, lines: [] };
      d.lines.push(`${s.subject}${s.componentModule ? ` ${s.componentModule}` : ''}`);
      map.set(k, d);
    }
    for (const r of data.rounds) {
      const k = r.examDate.slice(0, 10);
      const d = map.get(k) ?? { date: r.examDate, lines: [] };
      d.round = r.roundNumber;
      map.set(k, d);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <>
      <PageHeader
        title="Cronograma"
        subtitle={data?.classGroup ? `${data.classGroup} · aulas às sextas, das 19h às 22h` : 'Aulas e provas da sua turma'}
        actions={days.length > 0 && <button className="btn-primary" onClick={() => downloadPdf('schedule/me/pdf', 'cronograma.pdf').catch((e) => toast(e.message, 'error'))}>Baixar PDF</button>}
      />
      {!days.length ? (
        <div className="card"><Empty icon="🗓️" title="Cronograma ainda não disponível" desc="A secretaria publicará as datas das aulas e das provas aqui." /></div>
      ) : (
        <div className="grid gap-3">
          {days.map((d) => (
            <div key={d.date} className={`card p-4 flex gap-4 ${d.round ? 'border-indigo-300 bg-indigo-50/40' : ''}`}>
              <div className="w-28 shrink-0 font-semibold">{br(d.date)}</div>
              <div className="text-sm">
                {d.lines.map((l, i) => <div key={i}>{l}</div>)}
                {d.round && <span className="pill-accent">Provas — Prova {d.round}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
