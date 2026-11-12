-- Documentos dos alunos: quem anexou (aluno ou secretaria) e quem analisou.
-- Só ADICIONA colunas e chaves; nada é apagado. O único comando que altera dados é o UPDATE no fim.

-- AlterTable
ALTER TABLE "documentos_aluno" ADD COLUMN     "analisado_por_admin_id" TEXT,
ADD COLUMN     "enviado_por" TEXT NOT NULL DEFAULT 'student',
ADD COLUMN     "enviado_por_admin_id" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE "documentos_aluno" ADD CONSTRAINT "documentos_aluno_enviado_por_admin_id_fkey" FOREIGN KEY ("enviado_por_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_aluno" ADD CONSTRAINT "documentos_aluno_analisado_por_admin_id_fkey" FOREIGN KEY ("analisado_por_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Padroniza o status antigo em português para o padrão do projeto (inglês).
UPDATE "documentos_aluno" SET "status" = 'pending' WHERE "status" = 'pendente';
