export function renderPdfHeader(doc: PDFKit.PDFDocument) {
  // Desenha o fundo escuro do cabeçalho
  doc.rect(0, 0, doc.page.width, 70).fill('#0f172a');
  
  // Nome Principal (Alinhado à esquerda)
  doc.fillColor('white')
     .fontSize(16) // Reduzido levemente para caber o texto maior sem quebrar
     .font('Helvetica-Bold')
     .text('EJA ATITUDE', 40, 18);

  // Subtítulo Principal (Alinhado à esquerda)
  doc.fontSize(10)
     .font('Helvetica')
     .text('ENSINO MÉDIO EJA EAD 2026', 40, 42);

  // Endereço e Contato (Alinhados à direita e bem pequenos)
  // Definimos a largura (width) e subtraímos a margem para fixar o texto na direita
  const larguraDisponivel = doc.page.width - 80; // 40 de margem esquerda + 40 de margem direita
  
  doc.fontSize(8) // Tamanho bem pequeno conforme solicitado
     .font('Helvetica')
     .text('Rua Uruguai, 458\nTelefone: (53) 3261-1007\nJaguarão - RS', 40, 18, {
       width: larguraDisponivel,
       align: 'right',
       lineGap: 2
     });

  // Restaura a cor padrão para o corpo do texto do PDF e pula o espaço necessário
  doc.fillColor('black').moveDown(4);
}