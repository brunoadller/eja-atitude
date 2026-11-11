-- CreateTable
CREATE TABLE "aulas_cronograma" (
    "id" TEXT NOT NULL,
    "turma" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "disciplina" TEXT NOT NULL,
    "numero_aula" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aulas_cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provas_cronograma" (
    "id" TEXT NOT NULL,
    "turma" TEXT NOT NULL,
    "numero_prova" INTEGER NOT NULL,
    "disciplinas" TEXT[],
    "data_prova" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provas_cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aulas_cronograma_turma_idx" ON "aulas_cronograma"("turma");

-- CreateIndex
CREATE INDEX "provas_cronograma_turma_idx" ON "provas_cronograma"("turma");

-- CreateIndex
CREATE UNIQUE INDEX "provas_cronograma_turma_numero_prova_key" ON "provas_cronograma"("turma", "numero_prova");
