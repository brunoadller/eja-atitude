import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

/** Dono das notificações: um aluno OU um admin (sempre vindo da sessão). */
export type Recipient = { studentId: string } | { adminId: string };

/** Conteúdo de um aviso (o destinatário é passado à parte). */
export type NotificationContent = { type: string; title: string; message: string; link?: string };

/** Aceita o prisma normal ou o "tx" de uma transação (para o aviso nascer junto com a ação). */
type Db = Prisma.TransactionClient | typeof prisma;

export const NotificationsRepository = {
  createForStudent(studentId: string, content: NotificationContent, db: Db = prisma) {
    return db.notification.create({ data: { ...content, studentId } });
  },
  /** Uma notificação para cada admin cadastrado agora. */
  async createForAllAdmins(content: NotificationContent, db: Db = prisma) {
    const admins = await db.admin.findMany({ select: { id: true } });
    if (admins.length === 0) return 0;
    const r = await db.notification.createMany({ data: admins.map((a) => ({ ...content, adminId: a.id })) });
    return r.count;
  },
  /**
   * Para cada admin: se já existe um aviso NÃO LIDO do mesmo tipo e link, atualiza o texto e o traz para o topo;
   * senão, cria um novo. Assim, vários envios seguidos do mesmo aluno viram um aviso só.
   */
  createOrUpdateUnreadForAllAdmins(content: NotificationContent & { link: string }) {
    return prisma.$transaction(async (tx) => {
      const admins = await tx.admin.findMany({ select: { id: true } });
      for (const { id: adminId } of admins) {
        const open = await tx.notification.findFirst({
          where: { adminId, type: content.type, link: content.link, readAt: null },
          select: { id: true },
        });
        if (open) {
          await tx.notification.update({
            where: { id: open.id },
            data: { title: content.title, message: content.message, createdAt: new Date() },
          });
        } else {
          await tx.notification.create({ data: { ...content, adminId } });
        }
      }
      return admins.length;
    });
  },
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
