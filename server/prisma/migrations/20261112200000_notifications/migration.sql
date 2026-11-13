-- Notificações (aluno ou secretaria). Só CRIA uma tabela nova; não altera nem apaga dados.

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT,
    "admin_id" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "lida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id"),
    -- Exatamente um destinatário: ou um aluno, ou um admin (escrito à mão; o Prisma não gera CHECK).
    CONSTRAINT "notificacoes_destinatario_check" CHECK (("aluno_id" IS NULL) <> ("admin_id" IS NULL))
);

-- CreateIndex
CREATE INDEX "notificacoes_aluno_id_lida_em_idx" ON "notificacoes"("aluno_id", "lida_em");

-- CreateIndex
CREATE INDEX "notificacoes_admin_id_lida_em_idx" ON "notificacoes"("admin_id", "lida_em");

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
