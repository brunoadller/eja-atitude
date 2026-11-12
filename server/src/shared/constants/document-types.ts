export const DOCUMENT_TYPES = [
  'transcript',
  'id_card',
  'cpf',
  'proof_of_address',
  'voter_id',
  'photo_1',
  'photo_2',
  'military_certificate',
  'birth_certificate',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Nome de cada tipo como aparece na tela. Fonte única: o front busca esta lista em GET /api/documents/types. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  transcript: 'Histórico Escolar (Fundamental)',
  id_card: 'Carteira de Identidade',
  cpf: 'CPF',
  proof_of_address: 'Comprovante de Residência',
  voter_id: 'Título de Eleitor',
  photo_1: 'Foto 3x4 (1)',
  photo_2: 'Foto 3x4 (2)',
  military_certificate: 'Certificado de Reservista (se possuir)',
  birth_certificate: 'Certidão de Nascimento',
};

export const DOCUMENT_TYPE_LIST = DOCUMENT_TYPES.map((type) => ({ type, label: DOCUMENT_TYPE_LABELS[type] }));

/** Status de um documento (no banco e no código em inglês; na tela: pendente, aprovado, recusado). */
export const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/** Quem anexou o documento. */
export type DocumentUploader = 'student' | 'admin';
