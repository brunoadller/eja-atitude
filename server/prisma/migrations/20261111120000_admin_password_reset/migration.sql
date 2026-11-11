-- Troca e recuperação de senha da secretaria. Só ADICIONA coisas: não apaga nem altera dados existentes.

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "email" TEXT,
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "redefinicoes_senha_admin" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "verificado_em" TIMESTAMP(3),
    "usado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redefinicoes_senha_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "redefinicoes_senha_admin_admin_id_idx" ON "redefinicoes_senha_admin"("admin_id");

-- AddForeignKey
ALTER TABLE "redefinicoes_senha_admin" ADD CONSTRAINT "redefinicoes_senha_admin_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
