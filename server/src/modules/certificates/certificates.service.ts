import { Response } from 'express';
import { prisma } from '@/config/database';
import { DOC_LABEL, FeeDocType, feeForVia } from '@/shared/constants/fees';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { Session } from '@/shared/types/session';
import { completionBlockMessage, evaluateCompletion, syncCompletedStatus } from '@/modules/grades/completion.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { renderAttestationPdf, renderCertificatePdf } from './certificates.pdf';

async function loadStudent(id: string) {
  const s = await prisma.student.findUnique({ where: { id } });
  if (!s) throw new NotFoundError('aluno não encontrado');
  return s;
}

/**
 * Atestado de matrícula só existe para aluno ATIVO. Concluído recebe o certificado (pedido à secretaria);
 * pendente ainda não aceitou o contrato; trancado não está matriculado. Retorna null quando pode gerar.
 */
function attestationBlockReason(status: string): string | null {
  if (status === 'active') return null;
  if (status === 'completed') return 'curso concluído: o atestado de matrícula não está mais disponível. Solicite o certificado à secretaria.';
  if (status === 'pending') return 'aceite o contrato para liberar o atestado de matrícula';
  return 'matrícula trancada: o atestado de matrícula não está disponível';
}

function assertCanGenerateAttestation(status: string) {
  const reason = attestationBlockReason(status);
  if (reason) throw new ForbiddenError(reason);
}

type RequestStatus = 'awaiting_payment' | 'ready' | 'issued';

/**
 * Solicitação "em andamento" bloqueia uma nova. No certificado conta também "ready"
 * (pedido feito, aguardando a secretaria emitir), para não gerar pedidos duplicados.
 */
const isOpen = (type: FeeDocType, status: string) =>
  status === 'awaiting_payment' || (type === 'certificate' && status === 'ready');

async function loadCertificateRequest(requestId: string) {
  const req = await prisma.documentRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new NotFoundError('solicitação não encontrada');
  if (req.type !== 'certificate') throw new ValidationError('esta solicitação não é de certificado');
  return req;
}

export const CertificatesService = {
  /** Situação de cada documento para o aluno logado: próxima via, valor, pendências e histórico de solicitações. */
  async status(studentId: string) {
    const [requests, completion] = await Promise.all([
      prisma.documentRequest.findMany({ where: { studentId }, include: { invoice: true }, orderBy: { via: 'asc' } }),
      evaluateCompletion(studentId),
    ]);
    // ao abrir Secretaria → Diploma: pega também quem já cumpria notas + documentos antes desta regra existir
    await syncCompletedStatus(studentId, completion);
    // lido DEPOIS do sync: se o aluno acabou de virar "concluído", o atestado já aparece bloqueado
    const { status: studentStatus } = await loadStudent(studentId);
    const attestationBlock = attestationBlockReason(studentStatus);

    const build = (type: FeeDocType) => {
      const list = requests.filter((r) => r.type === type);
      const pending = list.find((r) => isOpen(type, r.status));
      const nextVia = list.length + 1;
      const eligible = type === 'certificate' ? completion.eligible : !attestationBlock;
      return {
        type,
        label: DOC_LABEL[type],
        nextVia,
        fee: feeForVia(type, nextVia),
        eligible,
        reasons: type === 'certificate' ? completion.reasons : attestationBlock ? [attestationBlock] : [],
        // só para o certificado: as três condições separadas (notas, parcelas, documentos) para a tela mostrar cada etapa
        checks: type === 'certificate' ? completion.checks : null,
        canRequest: eligible && !pending,
        requests: list.map((r) => ({
          id: r.id,
          via: r.via,
          status: r.status,
          feeAmount: Number(r.feeAmount),
          requestedAt: r.requestedAt,
          issuedAt: r.issuedAt,
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
    } else {
      assertCanGenerateAttestation((await loadStudent(studentId)).status);
    }
    return prisma.$transaction(async (tx) => {
      const existing = await tx.documentRequest.findMany({ where: { studentId, type } });
      if (existing.some((r) => r.status === 'awaiting_payment')) {
        throw new ConflictError('já existe uma taxa aguardando pagamento para este documento');
      }
      if (type === 'certificate' && existing.some((r) => r.status === 'ready')) {
        throw new ConflictError('já existe uma solicitação de certificado aguardando emissão pela secretaria');
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
      const created = await tx.documentRequest.create({
        data: { studentId, type, via, feeAmount: fee, invoiceId, status: fee > 0 ? 'awaiting_payment' : 'ready' },
      });
      // Certificado: avisa cada admin, na mesma transação (se o aviso falhar, a solicitação também não é gravada)
      if (type === 'certificate') {
        const student = await tx.student.findUniqueOrThrow({ where: { id: studentId }, select: { name: true, enrollment: true } });
        await NotificationsService.notifyCertificateRequested(tx, student, via, fee);
      }
      return created;
    });
  },

  /** Aluno baixa o ATESTADO já liberado (grátis ou taxa paga). O certificado não sai por aqui. */
  async download(requestId: string, session: Session, res: Response) {
    const req = await prisma.documentRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundError('solicitação não encontrada');
    if (session.type === 'student' && session.userId !== req.studentId) throw new ForbiddenError('acesso negado');
    if (req.type === 'certificate') {
      throw new ForbiddenError('o certificado é emitido pela secretaria: retire-o impresso, assinado e carimbado');
    }
    if (req.status === 'awaiting_payment') throw new ForbiddenError('pague a taxa na secretaria para liberar este documento');

    const student = await loadStudent(req.studentId);
    // via liberada antes da conclusão também deixa de sair depois que o aluno conclui
    assertCanGenerateAttestation(student.status);
    if (req.status === 'ready') await prisma.documentRequest.update({ where: { id: req.id }, data: { status: 'issued', issuedAt: new Date() } });
    return renderAttestationPdf(student, req.via, res);
  },

  // ── secretaria (impressão direta; a cobrança é feita no balcão) ──
  async adminAttestation(studentId: string, res: Response) {
    const student = await loadStudent(studentId);
    assertCanGenerateAttestation(student.status);
    renderAttestationPdf(student, 1, res);
  },
  /** Prévia do certificado pela secretaria. Sem "force": as três condições valem sempre. */
  async adminCertificate(studentId: string, res: Response) {
    const student = await loadStudent(studentId);
    const c = await evaluateCompletion(studentId);
    if (!c.eligible) throw new ForbiddenError(completionBlockMessage(c));
    renderCertificatePdf(student, c, 1, res);
  },

  /** Secretaria: lista as solicitações (com aluno, taxa e quem emitiu). */
  async listRequests(filter: { type?: FeeDocType; status?: RequestStatus }) {
    const rows = await prisma.documentRequest.findMany({
      where: { type: filter.type, status: filter.status },
      include: {
        student: { select: { id: true, name: true, enrollment: true, status: true } },
        invoice: { select: { status: true, dueDate: true, amount: true } },
        issuedByAdmin: { select: { name: true, username: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      via: r.via,
      status: r.status,
      feeAmount: Number(r.feeAmount),
      requestedAt: r.requestedAt,
      issuedAt: r.issuedAt,
      issuedByAdminName: r.issuedByAdmin ? r.issuedByAdmin.name || r.issuedByAdmin.username : null,
      student: r.student,
      invoice: r.invoice ? { ...r.invoice, amount: Number(r.invoice.amount) } : null,
    }));
  },

  /**
   * Secretaria baixa o PDF de uma solicitação de certificado para imprimir, assinar e carimbar.
   * Usa o renderCertificatePdf atual (layout não muda), só com o número certo da via.
   */
  async adminRequestPdf(requestId: string, res: Response) {
    const req = await loadCertificateRequest(requestId);
    if (req.status === 'awaiting_payment') throw new ForbiddenError('a taxa desta via ainda não foi paga');
    const student = await loadStudent(req.studentId);
    const c = await evaluateCompletion(student.id);
    if (!c.eligible) throw new ForbiddenError(completionBlockMessage(c));
    renderCertificatePdf(student, c, req.via, res);
  },

  /** Secretaria marca como emitido (depois de imprimir, assinar e carimbar). Guarda quem e quando. */
  async issue(adminId: string, requestId: string) {
    const req = await loadCertificateRequest(requestId);
    if (req.status === 'awaiting_payment') throw new ForbiddenError('a taxa desta via ainda não foi paga');
    if (req.status === 'issued') throw new ConflictError('esta via já foi marcada como emitida');
    // "where status: ready" evita marcar duas vezes se dois cliques chegarem juntos
    const done = await prisma.documentRequest.updateMany({
      where: { id: req.id, status: 'ready' },
      data: { status: 'issued', issuedAt: new Date(), issuedByAdminId: adminId },
    });
    if (done.count !== 1) throw new ConflictError('esta via já foi marcada como emitida');
    return { ok: true };
  },
};
