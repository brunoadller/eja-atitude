import { Prisma } from '@prisma/client';
import { addMonthsClamped } from '@/shared/utils/dates';
import { generateBarcodeLine } from '@/shared/utils/barcode';

/** Gera as N parcelas mensais (mesmo valor), a partir do 1º vencimento. */
export function buildInstallments(
  studentId: string,
  amount: number,
  count: number,
  firstDueDate: Date,
): Prisma.InvoiceCreateManyInput[] {
  return Array.from({ length: count }, (_, i) => {
    const due = addMonthsClamped(firstDueDate, i);
    const mm = String(due.getUTCMonth() + 1).padStart(2, '0');
    return {
      studentId,
      kind: 'installment',
      reference: `${mm}/${due.getUTCFullYear()}`,
      installmentNumber: i + 1,
      installmentTotal: count,
      amount,
      dueDate: due,
      barcodeLine: generateBarcodeLine(),
      status: 'open',
    };
  });
}
