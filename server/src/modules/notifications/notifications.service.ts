import { Prisma } from '@prisma/client';
import { logger } from '@/config/logger';
import { DOCUMENT_TYPE_LABELS, DocumentType } from '@/shared/constants/document-types';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Session } from '@/shared/types/session';
import { fmtMoney } from '@/shared/utils/dates';
import { NotificationsRepository, Recipient } from './notifications.repository';

/** Quantas notificações a lista devolve (as mais recentes). */
const LIST_LIMIT = 50;

/** Tipos gravados no banco (em inglês; o texto em português vai em título e mensagem). */
export const NOTIFICATION_TYPES = {
  documentApproved: 'document_approved',
  documentRejected: 'document_rejected',
  certificateRequested: 'certificate_requested',
} as const;

/** Telas do client para onde o clique no aviso leva. */
const LINKS = {
  studentDocuments: '/secretaria/documentos',
  adminCertificates: '/certificados',
} as const;

const documentLabel = (type: string) => DOCUMENT_TYPE_LABELS[type as DocumentType] ?? type;

/** " Motivo: foto ilegível." — põe o ponto final se a secretaria não pôs. */
const reasonText = (note?: string | null) => {
  const n = note?.trim();
  if (!n) return '';
  return ` Motivo: ${n}${/[.!?]$/.test(n) ? '' : '.'}`;
};

/** O destinatário sai SEMPRE da sessão (nunca do corpo da requisição). */
const recipientOf = (session: Session): Recipient =>
  session.type === 'admin' ? { adminId: session.userId } : { studentId: session.userId };

export const NotificationsService = {
  async list(session: Session) {
    const recipient = recipientOf(session);
    const [items, unread] = await Promise.all([
      NotificationsRepository.findByRecipient(recipient, LIST_LIMIT),
      NotificationsRepository.countUnread(recipient),
    ]);
    return { items, unread };
  },

  async unreadCount(session: Session) {
    return { unread: await NotificationsRepository.countUnread(recipientOf(session)) };
  },

  /** Notificação de outra pessoa responde "não encontrada" (não revela que o id existe). Já lida: não faz nada. */
  async markRead(session: Session, id: string) {
    const recipient = recipientOf(session);
    const changed = await NotificationsRepository.markRead(recipient, id);
    if (changed === 0 && (await NotificationsRepository.exists(recipient, id)) === 0) {
      throw new NotFoundError('notificação não encontrada');
    }
    return this.unreadCount(session);
  },

  async markAllRead(session: Session) {
    await NotificationsRepository.markAllRead(recipientOf(session));
    return { unread: 0 };
  },

  /**
   * Avisa o aluno que a secretaria aprovou ou recusou um documento (com o motivo, se recusou).
   * Se a gravação do aviso falhar, a aprovação/recusa NÃO é desfeita: o erro só vai para o log.
   */
  async notifyDocumentReviewed(studentId: string, documentType: string, status: 'approved' | 'rejected', note?: string | null) {
    const label = documentLabel(documentType);
    const content =
      status === 'approved'
        ? {
            type: NOTIFICATION_TYPES.documentApproved,
            title: 'Documento aprovado',
            message: `Seu documento "${label}" foi aprovado pela secretaria.`,
            link: LINKS.studentDocuments,
          }
        : {
            type: NOTIFICATION_TYPES.documentRejected,
            title: 'Documento recusado',
            message: `Seu documento "${label}" foi recusado pela secretaria.${reasonText(note)} Envie o documento novamente.`,
            link: LINKS.studentDocuments,
          };
    try {
      await NotificationsRepository.createForStudent(studentId, content);
    } catch (err) {
      logger.error({ err: (err as Error).message, studentId, documentType }, 'não foi possível criar a notificação do documento');
    }
  },

  /** Avisa cada admin que um aluno solicitou o certificado. Roda dentro da transação da solicitação. */
  async notifyCertificateRequested(
    tx: Prisma.TransactionClient,
    student: { name: string; enrollment: string },
    via: number,
    fee: number,
  ) {
    const feeText = fee > 0 ? ` Aguardando pagamento da taxa de R$ ${fmtMoney(fee)}.` : '';
    await NotificationsRepository.createForAllAdmins(
      {
        type: NOTIFICATION_TYPES.certificateRequested,
        title: 'Solicitação de certificado',
        message: `${student.name} (matrícula ${student.enrollment}) solicitou a ${via}ª via do certificado.${feeText}`,
        link: LINKS.adminCertificates,
      },
      tx,
    );
  },
};
