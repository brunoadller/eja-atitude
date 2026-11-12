import authRoutes from '@/modules/auth/auth.routes';
import booksRoutes from '@/modules/books/books.routes';
import certificatesRoutes from '@/modules/certificates/certificates.routes';
import contractsRoutes from '@/modules/contracts/contracts.routes';
import documentsRoutes from '@/modules/documents/documents.routes';
import gradesRoutes from '@/modules/grades/grades.routes';
import invoicesRoutes from '@/modules/invoices/invoices.routes';
import scheduleRoutes from '@/modules/schedule/schedule.routes';
import schoolRoutes from '@/modules/school/school.routes';
import studentsRoutes from '@/modules/students/students.routes';
import { Router } from 'express';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentsRoutes);
router.use('/grades', gradesRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/books', booksRoutes);
router.use('/documents', documentsRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/contracts', contractsRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/school', schoolRoutes);


export default router;
