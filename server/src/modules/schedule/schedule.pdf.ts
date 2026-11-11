import { ClassSession, ExamRound, ExamRoundItem } from '@prisma/client';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { fmtDate } from '@/shared/utils/dates';

type Round = ExamRound & { items: ExamRoundItem[] };

/** PDF no formato do cronograma da escola: DATA | DISCIPLINAS, com linhas "Provas". */
export function renderSchedulePdf(res: Response, classGroup: string, sessions: ClassSession[], rounds: Round[]) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Cronograma ${classGroup}` } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="cronograma.pdf"`);
  doc.pipe(res);

  const first = sessions[0]?.date;
  doc.fillColor('#e11d1d').font('Helvetica-Bold').fontSize(20).text(`Cronograma ${classGroup}`, { align: 'center' });
  doc.moveDown(1);
  doc.fillColor('#000').fontSize(12).text(`Início: ${first ? fmtDate(first) : '—'}`, 50, doc.y, { continued: true });
  doc.text('        Horário 19h às 22h');
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(9.5).text(
    'As aulas ocorrerão às sextas-feiras, e em alguns casos as provas serão realizadas nas segundas-feiras.',
  );
  doc.moveDown(1);

  // monta as linhas por data
  const byDate = new Map<string, { date: Date; lines: string[]; exam?: Round }>();
  for (const s of sessions) {
    const k = s.date.toISOString().slice(0, 10);
    const row = byDate.get(k) ?? { date: s.date, lines: [] };
    row.lines.push(s.componentModule ? `${s.subject} ${s.componentModule}` : s.subject);
    byDate.set(k, row);
  }
  for (const r of rounds) {
    const k = r.examDate.toISOString().slice(0, 10);
    const row = byDate.get(k) ?? { date: r.examDate, lines: [] };
    row.exam = r;
    byDate.set(k, row);
  }
  const rows = [...byDate.values()].sort((a, b) => +a.date - +b.date);

  const x0 = 50, w1 = 120, w2 = 330, pad = 6, lh = 15;
  const drawRow = (date: string, lines: string[], bold = false) => {
    const h = lines.length * lh + pad * 2 - 4;
    if (doc.y + h > doc.page.height - 50) doc.addPage();
    const y = doc.y;
    doc.lineWidth(0.8).strokeColor('#000').rect(x0, y, w1, h).stroke().rect(x0 + w1, y, w2, h).stroke();
    doc.fillColor('#000').font('Helvetica').fontSize(11).text(date, x0 + pad, y + pad - 1, { width: w1 - pad, lineBreak: false });
    lines.forEach((l, i) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).text(l, x0 + w1 + pad, y + pad - 1 + i * lh, { width: w2 - pad, lineBreak: false });
    });
    doc.y = y + h;
  };

  doc.font('Helvetica-Bold');
  drawRow('DATA', ['DISCIPLINAS'], true);
  for (const r of rows) {
    if (r.exam) drawRow(fmtDate(r.date), [`Provas — Prova ${r.exam.roundNumber}`]);
    else drawRow(fmtDate(r.date), r.lines);
  }
  if (!rows.length) {
    doc.moveDown(1).font('Helvetica').fontSize(11).text('Nenhum cronograma cadastrado ainda.');
  }
  doc.end();
}
