import { Response } from 'express';
import { prisma } from '@/config/database';
import { DOC_LABEL, FeeDocType, feeForVia } from '@/shared/constants/fees';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Session } from '@/shared/types/session';
import { completionBlockMessage, evaluateCompletion } from '@/modules/grades/completion.service';
import { renderAttestationPdf, renderCertificatePdf } from './certificates.pdf';

async function loadStudent(id: string) {
  const s = await prisma.student.findUnique({ where: { id } });
  if (!s) throw new NotFoundError('aluno não encontrado');
  return s;
}

export const CertificatesService = {
  /** Situação de cada documento para o aluno logado: próxima via, valor, pendências e histórico de solicitações. */
  async status(studentId: string) {
    const [requests, completion] = await Promise.all([
      prisma.documentRequest.findMany({ where: { studentId }, include: { invoice: true }, orderBy: { via: 'asc' } }),
      evaluateCompletion(studentId),
    ]);

    const build = (type: FeeDocType) => {
      const list = requests.filter((r) => r.type === type);
      const pending = list.find((r) => r.status === 'awaiting_payment');
      const nextVia = list.length + 1;
      const eligible = type === 'certificate' ? completion.eligible : true;
      return {
        type,
        label: DOC_LABEL[type],
        nextVia,
        fee: feeForVia(type, nextVia),
        eligible,
        reasons: type === 'certificate' ? completion.reasons : [],
        // só para o certificado: as três condições separadas (notas, parcelas, documentos) para a tela mostrar cada etapa
        checks: type === 'certificate' ? completion.checks : null,
        canRequest: eligible && !pending,
        requests: list.map((r) => ({
          id: r.id,
          via: r.via,
          status: r.status,
          feeAmount: Number(r.feeAmount),
          requestedAt: r.requestedAt,
          invoice: r.invoice
            ? { id: r.invoice.id, dueDate: r.invoice.dueDate, status: r.invoice.status, amount: Number(r.invoice.amount) }
            : null,
        })),
      };
    };
    return { attestation: build('attestation'), certificate: build('certificate') };
  },

  /** 1ª via sai direto; da 2ª em diante gera a taxa (boleto avulso) e só libera depois que a secretaria marcar como paga. */
  async request(studentId: string, type: FeeDocType) {
    if (type === 'certificate') {
      const c = await evaluateCompletion(studentId);
      // validação no servidor: as três condições ao mesmo tempo (não confia só na tela)
      if (!c.eligible) throw new ForbiddenError(completionBlockMessage(c));
    }
    return prisma.$transaction(async (tx) => {
      const existing = await tx.documentRequest.findMany({ where: { studentId, type } });
      if (existing.some((r) => r.status === 'awaiting_payment')) {
        throw new ConflictError('já existe uma taxa aguardando pagamento para este documento');
      }
      const via = existing.length + 1;
      const fee = feeForVia(type, via);
      let invoiceId: string | undefined;
      if (fee > 0) {
        const today = new Date();
        const inv = await tx.invoice.create({
          data: {
            studentId, kind: 'fee', status: 'open', amount: fee,
            dueDate: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
            reference: `Taxa ${via}ª via — ${DOC_LABEL[type]}`,
          },
        });
        invoiceId = inv.id;
      }
      return tx.documentRequest.create({
        data: { studentId, type, via, feeAmount: fee, invoiceId, status: fee > 0 ? 'awaiting_payment' : 'ready' },
      });
    });
  },

  /** Aluno baixa uma via que já foi liberada (grátis ou taxa paga). */
  async download(requestId: string, session: Session, res: Response) {
    const req = await prisma.documentRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundError('solicitação não encontrada');
    if (session.type === 'student' && session.userId !== req.studentId) throw new ForbiddenError('acesso negado');
    if (req.status === 'awaiting_payment') throw new ForbiddenError('pague a taxa na secretaria para liberar este documento');

    const student = await loadStudent(req.studentId);
    if (req.type === 'certificate') {
      const c = await evaluateCompletion(student.id);
      if (!c.eligible) throw new ForbiddenError(completionBlockMessage(c));
      if (req.status === 'ready') await prisma.documentRequest.update({ where: { id: req.id }, data: { status: 'issued', issuedAt: new Date() } });
      return renderCertificatePdf(student, c, req.via, res);
    }
    if (req.status === 'ready') await prisma.documentRequest.update({ where: { id: req.id }, data: { status: 'issued', issuedAt: new Date() } });
    return renderAttestationPdf(student, req.via, res);
  },

  // ── secretaria (impressão direta; a cobrança é feita no balcão) ──
  async adminAttestation(studentId: string, res: Response) {
    renderAttestationPdf(await loadStudent(studentId), 1, res);
  },
  async adminCertificate(studentId: string, force: boolean, res: Response) {
    const student = await loadStudent(studentId);
    const c = await evaluateCompletion(studentId);
    if (!c.eligible && !force) throw new ForbiddenError(completionBlockMessage(c));
    renderCertificatePdf(student, c, 1, res);
  },
};
