import { Student } from '@prisma/client';
import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { getPeriod } from '@/shared/constants/academic-calendar';
import { MODULE_ROMAN, ModuleNumber, TRANSCRIPT_ROWS } from '@/shared/constants/curriculum';
import { SCHOOL, schoolCnpjLine, schoolPhonesLine } from '@/config/school';
import { renderPdfHeader } from '@/shared/services/pdf-header';
import { fmtDate } from '@/shared/utils/dates';
import { Completion } from '@/modules/grades/completion.service';

const ASSETS = path.resolve(__dirname, '../../../assets');
const viaLabel = (via: number) => `${via}ª via`;
const yearOf = (s: Student) => (s.enrollmentDate ?? new Date()).getUTCFullYear();

// ───────────────────────── ATESTADO DE MATRÍCULA ─────────────────────────
// (modelo já editado por você: texto e estilo mantidos; só as datas passaram a vir do calendário do módulo)
export function renderAttestationPdf(student: Student, via: number, res: Response) {
  const year = yearOf(student);
  const moduleNumber = (student.moduleNumber === 1 ? 1 : 2) as ModuleNumber;
  const period = getPeriod(year, moduleNumber);

  const nameFormated = student.name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // formata a data de rodapé
  const dateFormated = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const textDateFooter = `${SCHOOL.city}, ${dateFormated}`;
  // formata a data de matrícula
  const enrollmentDateFormated = student.enrollmentDate
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date(student.enrollmentDate))
    : 'Data não informada';
  const enrollmentCertificatedText = `
      Atestamos para os devidos fins, que ${nameFormated} está devidamente matriculado(a) neste estabelecimento no curso de ${student.modality} EJA EAD ${year} - EJA MODULO ${MODULE_ROMAN[moduleNumber]}, turno NOITE a contar de ${enrollmentDateFormated} tendo início das aulas em ${period.startClasses} a ${period.endClasses} sob o número de matrícula ${student.enrollment}.`;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="enrollment_${student.enrollment}.pdf"`);
  doc.pipe(res);
  renderPdfHeader(doc);
  doc.moveDown(2);
  doc.fontSize(18).font('Helvetica-Bold').text('ATESTADO DE MATRÍCULA', { align: 'center' });
  if (via > 1) doc.fontSize(9).font('Helvetica').fillColor('#555').text(`(${viaLabel(via)})`, { align: 'center' }).fillColor('#000');

  // descrição
  doc.moveDown(1);
  doc.fontSize(14).font('Helvetica').text(enrollmentCertificatedText, { align: 'justify', lineGap: 6 });
  // rodapé
  doc.moveDown(20);
  doc.fontSize(14).font('Helvetica').fillColor('#000').text(textDateFooter, { align: 'right' });
  doc.end();
}

// ───────────────────────── CERTIFICADO DE CONCLUSÃO + HISTÓRICO ─────────────────────────
const fmtGrade = (n: number) => n.toFixed(1).replace('.', ',');
const roundedBox = (doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, lw = 1) =>
  doc.lineWidth(lw).strokeColor('#000').rect(x, y, w, h).stroke();

export function renderCertificatePdf(student: Student, completion: Completion, via: number, res: Response) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: 'Certificado de Conclusão' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="certificate_${student.enrollment}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width; // 841.89
  const L = 28, CW = W - 56;
  const year = yearOf(student);
  const today = fmtDate(new Date());
  const upper = (s?: string | null) => (s ?? '').toUpperCase();

  // ── Página 1: cabeçalho ──
  const brasao = path.join(ASSETS, 'brasao.png');
  const logo = path.join(ASSETS, 'logo-unitec.png');
  if (fs.existsSync(brasao)) doc.image(brasao, L + 12, 24, { height: 64 });
  if (fs.existsSync(logo)) doc.image(logo, W - L - 118, 34, { width: 108 });

  // dados da escola vêm de config/school.ts (mesmas posições e fontes de antes)
  const cnpj = schoolCnpjLine();
  doc.fillColor('#000').font('Times-Bold').fontSize(12).text(SCHOOL.name.toUpperCase(), 0, 28, { width: W, align: 'center', lineBreak: false });
  doc.font('Times-Roman').fontSize(9.5);
  doc.text(`ENTIDADE MANTENEDORA: ${SCHOOL.legalName.toUpperCase()}${cnpj ? ` - ${cnpj}` : ''}`, 0, 44, { width: W, align: 'center', lineBreak: false });
  doc.text(SCHOOL.deliberation.toUpperCase(), 0, 58, { width: W, align: 'center', lineBreak: false });
  doc.text(
    `${SCHOOL.address}  ${SCHOOL.city}/${SCHOOL.state} - Fone: ${schoolPhonesLine()}${SCHOOL.zipCode ? ` CEP: ${SCHOOL.zipCode}` : ''}`,
    0, 72, { width: W, align: 'center', lineBreak: false },
  );

  doc.rect(L, 96, CW, 17).fillAndStroke('#d9e6f3', '#8da2b8');
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('CERTIFICADO DE CONCLUSÃO', L, 101, { width: CW, align: 'center', lineBreak: false });

  // ── dados do aluno ──
  roundedBox(doc, L, 118, CW, 46, 1.3);
  const field = (label: string, value: string, x: number, y: number, w: number, size = 8.5) => {
    doc.font('Helvetica-Bold').fontSize(size).fillColor('#000').text(label, x, y, { lineBreak: false, continued: true, width: w });
    doc.font('Helvetica').text(` ${value}`, { width: w, lineBreak: false, ellipsis: true });
  };
  field('Aluno(a):', upper(student.name), L + 8, 125, 330);
  field('Identidade:', student.rg ?? '', L + 8, 143, 330);
  field('Natural de:', upper(student.birthplace), 330, 125, 300);
  field('Filiação:', `${upper(student.motherName)} / ${upper(student.fatherName)}`, 330, 143, 310, 7.5);
  field('Nacionalidade:', upper(student.nationality), 655, 125, 155);
  field('Nascido em:', fmtDate(student.birthDate), 655, 143, 155);

  roundedBox(doc, L, 168, CW, 34, 1);
  doc.font('Helvetica').fontSize(9).text(
    `Certificamos que ${upper(student.name)}, concluiu o Ensino Médio na modalidade de Educação de Jovens e Adultos na forma de Ensino a Distância no ano de ${year}, ` +
      `nos termos da Lei Federal 9394/96 e ${SCHOOL.deliberation}, com base no Regimento Escolar, tendo obtido os resultados constantes neste histórico.`,
    L + 6, 173, { width: CW - 12, align: 'justify' },
  );

  // ── matriz Disciplina × M1..M10 ──
  const colName = 150, colW = (CW - colName) / 10, rowH = 13.6, headH = 15;
  let y = 208;
  doc.rect(L, y, CW, headH).fillAndStroke('#e5e7eb', '#000');
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(8.5).text('Disciplina', L + 4, y + 4, { lineBreak: false });
  for (let m = 1; m <= 10; m++) {
    doc.text(`M${m}`, L + colName + (m - 1) * colW, y + 4, { width: colW, align: 'center', lineBreak: false });
  }
  y += headH;
  for (const row of TRANSCRIPT_ROWS) {
    doc.lineWidth(0.5).strokeColor('#000').rect(L, y, CW, rowH).stroke();
    doc.font('Helvetica').fontSize(8).fillColor('#000').text(row, L + 4, y + 3.5, { lineBreak: false, width: colName - 6 });
    for (let m = 1; m <= 10; m++) {
      const g = completion.matrix[row]?.[m];
      const cx = L + colName + (m - 1) * colW;
      doc.moveTo(cx, y).lineTo(cx, y + rowH).stroke();
      // nota lançada; "#" = aproveitamento de estudos (módulo não cursado aqui)
      doc.text(g !== undefined ? fmtGrade(g) : '#', cx, y + 3.5, { width: colW, align: 'center', lineBreak: false });
    }
    y += rowH;
  }
  doc.moveTo(L + colName, 208).lineTo(L + colName, y).lineWidth(0.5).stroke();

  roundedBox(doc, L, y + 6, CW, 16, 1.2);
  doc.font('Helvetica').fontSize(7.8).text(
    'LEGENDA:  PL = Período Letivo;  M = Módulo do componente curricular;  # ( sustenido ) = Aproveitamento de estudos.  - ( traço ) Espaço anulado.',
    L + 6, y + 11, { lineBreak: false },
  );
  doc.fontSize(9).text(`${SCHOOL.city}, ${today}`, L, 560, { lineBreak: false });
  if (via > 1) doc.fontSize(8).fillColor('#555').text(viaLabel(via), 0, 560, { width: W - L, align: 'right', lineBreak: false });

  // ── Página 2: aproveitamento de estudos / observações ──
  doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.fillColor('#000');
  roundedBox(doc, L, 28, CW, 150, 1.5);
  doc.moveTo(L, 46).lineTo(L + CW, 46).lineWidth(1.5).stroke();
  doc.font('Helvetica-Bold').fontSize(10).text('APROVEITAMENTO DE ESTUDOS CONFORME ART.24 - LEI FEDERAL 9394/96', L, 33, { width: CW, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(9).text(student.priorStudies?.trim() || '', L + 10, 54, { width: CW - 20, height: 118 });

  const obs = [
    'OBSERVAÇÕES:',
    '1 - Classificação dos Alunos',
    'a) por promoção, para alunos que cursaram, com aproveitamento, o módulo anterior, na própria escola;',
    'b) por transferência, para alunos procedentes de outras escolas; nesse caso, o aluno será submetido à testagem diagnóstica, após análise de currículo, a fim de orientá-lo quanto ao módulo a ser cursado;',
    'c) mediante comprovação das competências e habilidades correspondentes ao Ensino Fundamental, mediante apresentação de resultado de exames de equivalência.',
    '2 - Nota mínima para aprovação: 5,0 (cinco), em cada módulo de cada componente curricular.',
    '3 - Orientação Educacional e Vocacional desenvolvida de forma assistemática.',
    '4 - A disciplina de Literatura foi ministrada juntamente com a disciplina de L. Portuguesa.',
    `5 - Ano letivo ${year}`,
  ];
  let oy = 196;
  obs.forEach((t, i) => {
    doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).text(t, L, oy, { width: 520 });
    oy = doc.y + 3;
  });

  // período letivo
  const ty = 388, cols = [90, 120, 90, 90];
  const heads = ['Período Letivo', 'Turma', 'Data Início', 'Data Término'];
  let cx = L;
  doc.lineWidth(0.8);
  heads.forEach((h, i) => {
    doc.rect(cx, ty, cols[i], 15).fillAndStroke('#e5e7eb', '#000');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(8.5).text(h, cx + 4, ty + 4, { lineBreak: false });
    cx += cols[i];
  });
  let ry = ty + 15;
  for (let m = student.startModuleNumber; m <= student.moduleNumber; m++) {
    const p = getPeriod(year, m as ModuleNumber);
    const vals = [p.label, 'EJA ETAPA II', p.startClasses, p.endClasses];
    cx = L;
    vals.forEach((v, i) => {
      doc.rect(cx, ry, cols[i], 15).stroke();
      doc.font('Helvetica').fontSize(8.5).fillColor('#000').text(v, cx + 4, ry + 4, { lineBreak: false });
      cx += cols[i];
    });
    ry += 15;
  }

  // carimbo, assinaturas e registro
  roundedBox(doc, 580, 215, 234, 120, 1.5);
  doc.font('Helvetica').fontSize(9).text('Carimbo da Escola', 580, 222, { width: 234, align: 'center', lineBreak: false });
  doc.lineWidth(0.8).moveTo(150, 505).lineTo(310, 505).stroke().moveTo(350, 505).lineTo(540, 505).stroke();
  doc.fontSize(9).text('Secretário(a)', 150, 509, { width: 160, align: 'center', lineBreak: false });
  doc.text('Diretor(a)', 350, 509, { width: 190, align: 'center', lineBreak: false });
  doc.text('Registro no Livro________, fl. ____', 580, 495, { lineBreak: false });
  doc.fontSize(9).text(`${SCHOOL.city}, ${today}`, L, 560, { lineBreak: false });

  doc.end();
}
