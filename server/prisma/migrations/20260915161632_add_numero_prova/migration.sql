/*
  Warnings:

  - You are about to drop the column `bimestre` on the `notas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notas" DROP COLUMN "bimestre",
ADD COLUMN     "data_agendada" TIMESTAMP(3),
ADD COLUMN     "numero_prova" INTEGER,
ADD COLUMN     "taxa_cobrada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tentativa" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "nota" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "notas_aluno_id_disciplina_numero_prova_idx" ON "notas"("aluno_id", "disciplina", "numero_prova");
