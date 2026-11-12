-- Certificado: qual admin marcou a solicitação como emitida.
-- Só ADICIONA uma coluna (vazia) e a chave estrangeira; não altera nem apaga dados.

-- AlterTable
ALTER TABLE "solicitacoes_documentos" ADD COLUMN     "emitido_por_admin_id" TEXT;

-- AddForeignKey
ALTER TABLE "solicitacoes_documentos" ADD CONSTRAINT "solicitacoes_documentos_emitido_por_admin_id_fkey" FOREIGN KEY ("emitido_por_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
