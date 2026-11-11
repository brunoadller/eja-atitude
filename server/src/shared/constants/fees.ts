import { env } from '@/config/env';

export type FeeDocType = 'attestation' | 'certificate';

/** Valores do arquivo "Orientações aos alunos – EJA". */
export const FEES = {
  attestation: 30.0,   // atestado de matrícula
  certificate: 70.0,   // certificado de conclusão
  recovery: 30.0,      // a partir da 2ª recuperação
} as const;

export const PASSING_SCORE = 5.0;               // média mínima para aprovação
export const RECOVERY_FEE_FROM_ATTEMPT = 3;     // tentativa 1 = prova, 2 = 1ª recuperação, 3 = 2ª recuperação (cobra)
export const DOC_LABEL: Record<FeeDocType, string> = {
  attestation: 'Atestado de Matrícula',
  certificate: 'Certificado de Conclusão',
};

/** Valor a cobrar para a via N (1 = primeira). */
export function feeForVia(type: FeeDocType, via: number): number {
  if (via === 1 && env.FIRST_VIA_FREE) return 0;
  return FEES[type];
}
