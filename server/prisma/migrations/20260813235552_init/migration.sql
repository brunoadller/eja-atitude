-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "data_nascimento" DATE,
    "sexo" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "nome_mae" TEXT,
    "nome_pai" TEXT,
    "escolaridade" TEXT,
    "modalidade" TEXT,
    "turma" TEXT,
    "data_matricula" DATE,
    "valor_mensalidade" DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "senha_hash" TEXT,
    "contrato_aceito" BOOLEAN NOT NULL DEFAULT false,
    "contrato_aceito_em" TIMESTAMP(3),
    "contrato_versao" TEXT,
    "contrato_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL DEFAULT 1,
    "nota" DECIMAL(4,2) NOT NULL,
    "ano" INTEGER NOT NULL DEFAULT 2026,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletos" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "linha_digitavel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "data_pagamento" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apostilas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "modulo" TEXT,
    "descricao" TEXT,
    "url_arquivo" TEXT,
    "modalidade" TEXT NOT NULL DEFAULT 'todos',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apostilas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_aluno" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacao" TEXT,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analisado_em" TIMESTAMP(3),

    CONSTRAINT "documentos_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes" (
    "token" VARCHAR(64) NOT NULL,
    "tipo" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "alunos_matricula_key" ON "alunos"("matricula");

-- CreateIndex
CREATE INDEX "notas_aluno_id_idx" ON "notas"("aluno_id");

-- CreateIndex
CREATE INDEX "boletos_aluno_id_idx" ON "boletos"("aluno_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_usuario_key" ON "admins"("usuario");

-- CreateIndex
CREATE INDEX "documentos_aluno_aluno_id_idx" ON "documentos_aluno"("aluno_id");

-- CreateIndex
CREATE INDEX "documentos_aluno_tipo_idx" ON "documentos_aluno"("tipo");

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_aluno" ADD CONSTRAINT "documentos_aluno_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
