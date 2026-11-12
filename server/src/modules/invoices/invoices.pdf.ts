import { Invoice, Student } from '@prisma/client';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { SCHOOL, schoolAddressLine, schoolCnpjLine, schoolPhonesLine } from '@/config/school';
import { MODULE_ROMAN, ModuleNumber } from '@/shared/constants/curriculum';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { fmtDate, fmtMoney } from '@/shared/utils/dates';
import { InvoicesRepository } from './invoices.repository';

const VIAS = ['1ª via — Aluno', '2ª via — Auditoria', '3ª via — Caixa'];
// Beneficiário do carnê: razão social; abaixo, nome da escola, endereço, telefones e CNPJ (se houver). Fonte: config/school.ts
const BENEFICIARY = SCHOOL.legalName.toUpperCase();
const ADDRESS = [SCHOOL.name, schoolAddressLine(), `Fone ${schoolPhonesLine()}`, schoolCnpjLine()].filter(Boolean).join(' · ');
const NAVY = '#0f172a';
const GRAY = '#6b7280';

function periodText(student: Student): string {
  const year = (student.enrollmentDate ?? new Date()).getUTCFullYear();
  const m = (student.moduleNumber === 1 ? 1 : 2) as ModuleNumber;
  return `EJA${year} - ${year}/${m} · Módulo EJA ${MODULE_ROMAN[m]}`;
}

/** Uma "via" (1/3 da página A4), seguindo o modelo do boleto de exemplo da escola. */
function drawSlip(doc: PDFKit.PDFDocument, y0: number, via: string, inv: Invoice, student: Student) {
  const L = 40;
  const R = doc.page.width - 40;

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16).text(BENEFICIARY, L, y0, { lineBreak: false });
  doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(ADDRESS, L, y0 + 22, { lineBreak: false });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(via, L, y0 + 4, { width: R - L, align: 'right', lineBreak: false });

  doc.moveTo(L, y0 + 38).lineTo(R, y0 + 38).lineWidth(0.6).strokeColor('#cbd5e1').stroke();

  const rows: [string, string][] = [
    ['Aluno:', student.name],
    ['Matrícula:', student.enrollment],
    ['Período:', periodText(student)],
  ];
  rows.forEach(([k, v], i) => {
    const y = y0 + 54 + i * 18;
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(k, L, y, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).text(v, L + 55, y, { width: 240, lineBreak: false, ellipsis: true });
  });

  // caixa com parcela / vencimento / valor
  const bx = 335, by = y0 + 42, bw = R - bx, bh = 70;
  doc.roundedRect(bx, by, bw, bh, 6).lineWidth(1.2).strokeColor(NAVY).stroke();

  const isInstallment = inv.kind === 'installment';
  doc.fillColor(GRAY).font('Helvetica').fontSize(7).text(isInstallment ? 'PARCELA' : 'REFERÊNCIA', bx + 10, by + 7, { lineBreak: false });
  doc.fillColor(NAVY).font('Helvetica-Bold');
  if (isInstallment) {
    doc.fontSize(13).text(`${inv.installmentNumber} de ${inv.installmentTotal}`, bx + 10, by + 17, { lineBreak: false });
  } else {
    doc.fontSize(8.5).text(inv.reference, bx + 10, by + 18, { width: 100, height: 22 });
  }
  doc.fillColor(GRAY).font('Helvetica').fontSize(7).text('VENCIMENTO', bx + 115, by + 7, { lineBreak: false });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text(fmtDate(inv.dueDate), bx + 115, by + 17, { lineBreak: false });
  doc.fillColor(GRAY).font('Helvetica').fontSize(7).text('VALOR (R$)', bx + 10, by + 41, { lineBreak: false });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(17).text(fmtMoney(Number(inv.amount)), bx + 10, by + 50, { lineBreak: false });

  doc.fillColor('#b91c1c').font('Helvetica-BoldOblique').fontSize(8.5)
    .text('Evite multa e juros — pague em dia sua parcela.', L, y0 + 125, { lineBreak: false });
  doc.fillColor(GRAY).font('Helvetica').fontSize(7)
    .text(
      'Após o vencimento: multa de 2% + juros de 1% a.m. Atraso superior a 30 dias: inclusão no CPC. ' +
        `Pagamento somente na secretaria — ${SCHOOL.address}, ${SCHOOL.city}/${SCHOOL.state}, fone ${schoolPhonesLine()}.`,
      L, y0 + 139, { width: R - L },
    );
}

function drawCutLine(doc: PDFKit.PDFDocument, y: number) {
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5).text('- recortar aqui', 40, y - 9, { lineBreak: false });
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).dash(3, { space: 3 }).lineWidth(0.7).strokeColor('#475569').stroke().undash();
}

/** Uma página por parcela, sempre com 3 vias. */
export function renderCarne(res: Response, items: { invoice: Invoice; student: Student }[], filename: string) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Carnê de boletos' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  doc.pipe(res);

  items.forEach(({ invoice, student }, idx) => {
    if (idx > 0) doc.addPage({ size: 'A4', margin: 0 });
    VIAS.forEach((via, i) => {
      const y0 = 40 + i * 260;
      drawSlip(doc, y0, via, invoice, student);
      if (i < VIAS.length - 1) drawCutLine(doc, y0 + 240);
    });
  });
  doc.end();
}

export async function renderInvoicePdf(invoiceId: string, res: Response) {
  const invoice = await InvoicesRepository.findByIdWithStudent(invoiceId);
  if (!invoice) throw new NotFoundError('boleto não encontrado');
  renderCarne(res, [{ invoice, student: invoice.student }], `boleto_${invoice.student.enrollment}_${invoice.installmentNumber ?? 'taxa'}.pdf`);
}

export async function renderStudentCarne(studentId: string, res: Response, onlyOpen: boolean) {
  const { prisma } = await import('@/config/database');
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError('aluno não encontrado');
  const invoices = (await InvoicesRepository.findByStudent(studentId)).filter(
    (i) => i.kind === 'installment' && (!onlyOpen || i.status !== 'paid'),
  );
  if (!invoices.length) throw new NotFoundError('nenhuma parcela para gerar o carnê');
  renderCarne(res, invoices.map((invoice) => ({ invoice, student })), `carne_${student.enrollment}.pdf`);
}
