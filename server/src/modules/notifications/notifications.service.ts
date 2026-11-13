import { NotFoundError } from '@/shared/errors/NotFoundError';
import { Session } from '@/shared/types/session';
import { NotificationsRepository, Recipient } from './notifications.repository';

/** Quantas notificações a lista devolve (as mais recentes). */
const LIST_LIMIT = 50;

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
};
