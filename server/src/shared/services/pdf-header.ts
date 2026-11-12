import fs from 'fs';
import path from 'path';
import { SCHOOL, schoolAddressLine, schoolCnpjLine, schoolPhonesLine } from '@/config/school';

const ASSETS = path.resolve(__dirname, '../../../assets');

/**
 * Cabeçalho do atestado: fundo branco, logo da escola à esquerda e contato à direita, com uma linha fina embaixo.
 * (O logo tem fundo branco, por isso saiu a faixa escura.) O corpo do PDF começa na mesma altura de antes.
 */
export function renderPdfHeader(doc: PDFKit.PDFDocument) {
  const L = 40;
  const R = doc.page.width - 40;

  // Logo (se o arquivo faltar, escreve o nome da escola no lugar)
  const logo = path.join(ASSETS, SCHOOL.logoPdf);
  if (fs.existsSync(logo)) {
    doc.image(logo, L, 12, { height: 46 });
  } else {
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13).text(SCHOOL.name.toUpperCase(), L, 28, { lineBreak: false });
  }

  // Linha fina separando o cabeçalho do corpo
  doc.moveTo(L, 66).lineTo(R, 66).lineWidth(0.6).strokeColor('#cbd5e1').stroke();

  // Endereço, telefones e CNPJ (se houver), à direita e bem pequenos
  const contato = [schoolAddressLine(), schoolPhonesLine(), schoolCnpjLine()].filter(Boolean).join('\n');
  doc.fillColor('#334155')
     .fontSize(8)
     .font('Helvetica')
     .text(contato, L, 18, { width: R - L, align: 'right', lineGap: 2 });

  // Restaura as cores e posiciona o corpo na mesma altura de antes (não depende de quantas linhas de contato há)
  doc.fillColor('black').strokeColor('black');
  doc.x = L;
  doc.y = 89;
}
