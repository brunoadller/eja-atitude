import { prisma } from '@/config/database';

/** Dono das notificações: um aluno OU um admin (sempre vindo da sessão). */
export type Recipient = { studentId: string } | { adminId: string };

export const NotificationsRepository = {
  findByRecipient(recipient: Recipient, take: number) {
    return prisma.notification.findMany({
      where: recipient,
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, type: true, title: true, message: true, link: true, readAt: true, createdAt: true },
    });
  },
  countUnread(recipient: Recipient) {
    return prisma.notification.count({ where: { ...recipient, readAt: null } });
  },
  /** O filtro pelo dono garante que ninguém marca a notificação de outra pessoa. Retorna quantas mudaram. */
  async markRead(recipient: Recipient, id: string) {
    const r = await prisma.notification.updateMany({ where: { ...recipient, id, readAt: null }, data: { readAt: new Date() } });
    return r.count;
  },
  exists(recipient: Recipient, id: string) {
    return prisma.notification.count({ where: { ...recipient, id } });
  },
  async markAllRead(recipient: Recipient) {
    const r = await prisma.notification.updateMany({ where: { ...recipient, readAt: null }, data: { readAt: new Date() } });
    return r.count;
  },
};
