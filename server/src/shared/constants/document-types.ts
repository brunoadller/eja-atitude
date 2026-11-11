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
