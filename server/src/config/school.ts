/**
 * Identidade da escola: ÚNICO lugar com nome, razão social, endereço e contatos.
 * PDFs (atestado, certificado, carnê) e telas leem daqui; nunca escreva esses dados direto no código.
 * Campos vazios ('') não aparecem nos documentos.
 */
export const SCHOOL = {
  name: 'Escola de Ensino Médio Atitude Pelotas',
  legalName: 'Centro de Aprendizagem Atitude LTDA',
  /** Ato de autorização (substitui a deliberação anterior). */
  deliberation: 'Deliberação nº 409/2026',
  address: 'Andrade Neves 2288',
  city: 'Pelotas',
  state: 'RS',
  /** A preencher. */
  zipCode: '',
  phones: ['(53) 3028-3591', '(53) 9602-0080'],
  /** A preencher quando a empresa enviar. Vazio = o PDF não mostra a linha do CNPJ. */
  cnpj: '',
  /** Arquivo em server/assets usado no cabeçalho dos PDFs. */
  logoPdf: 'logo-escola-pdf.png',
} as const;

/** "Andrade Neves 2288 · Pelotas/RS" (+ " · CEP ..." se houver). */
export const schoolAddressLine = () =>
  [SCHOOL.address, `${SCHOOL.city}/${SCHOOL.state}`, SCHOOL.zipCode && `CEP ${SCHOOL.zipCode}`].filter(Boolean).join(' · ');

/** "(53) 3028-3591 · (53) 9602-0080" */
export const schoolPhonesLine = () => SCHOOL.phones.join(' · ');

/** "CNPJ: ..." ou null se ainda não informado. */
export const schoolCnpjLine = () => (SCHOOL.cnpj ? `CNPJ: ${SCHOOL.cnpj}` : null);
