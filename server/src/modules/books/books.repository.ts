import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

export const BooksRepository = {
  findAll(moduleNumber?: number) {
    return prisma.book.findMany({
      where: moduleNumber ? { moduleNumber } : undefined,
      orderBy: [{ moduleNumber: 'asc' }, { subject: 'asc' }],
    });
  },
  findById(id: string) {
    return prisma.book.findUnique({ where: { id } });
  },
  create(data: Prisma.BookCreateInput) {
    return prisma.book.create({ data });
  },
  remove(id: string) {
    return prisma.book.delete({ where: { id } });
  },
};
