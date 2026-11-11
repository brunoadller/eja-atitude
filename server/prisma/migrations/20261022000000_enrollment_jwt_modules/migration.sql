-- Migration idempotente: pode rodar mesmo que parte das colunas/tabelas já exista no banco.

-- JWT é stateless: a tabela de sessões não é mais usada
DROP TABLE IF EXISTS "sessoes";

-- ===== alunos =====
ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "naturalidade" TEXT;
ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "nacionalidade" TEXT NOT NULL DEFAULT 'Brasileiro';
ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "aproveitamento_estudos" TEXT;
ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "numero_modulo" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "modulo_inicial" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "alunos" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "alunos" ALTER COLUMN "status" SET DEFAULT 'pending';
ALTER TABLE "alunos" ALTER COLUMN "valor_mensalidade" SET DEFAULT 199.00;

UPDATE "alunos" SET "status" = 'active' WHERE "status" IN ('ativo', 'active');
UPDATE "alunos" SET "status" = 'completed' WHERE "status" IN ('concluido', 'completed');
UPDATE "alunos" SET "status" = 'locked' WHERE "status" IN ('trancado', 'locked');
UPDATE "alunos" SET "status" = 'pending' WHERE "contrato_aceito" = false AND "status" = 'active';
UPDATE "alunos" SET "cpf" = NULL WHERE "cpf" = '';
UPDATE "alunos" SET "cpf" = regexp_replace("cpf", '\D', '', 'g') WHERE "cpf" IS NOT NULL;

-- Se esta linha falhar, existem CPFs duplicados: corrija-os e rode de novo.
CREATE UNIQUE INDEX IF NOT EXISTS "alunos_cpf_key" ON "alunos"("cpf");

-- ===== boletos =====
ALTER TABLE "boletos" ADD COLUMN IF NOT EXISTS "tipo" TEXT NOT NULL DEFAULT 'installment';
ALTER TABLE "boletos" ADD COLUMN IF NOT EXISTS "parcela" INTEGER;
ALTER TABLE "boletos" ADD COLUMN IF NOT EXISTS "total_parcelas" INTEGER;
ALTER TABLE "boletos" ALTER COLUMN "status" SET DEFAULT 'open';
UPDATE "boletos" SET "status" = 'open' WHERE "status" IN ('aberto', 'open');
UPDATE "boletos" SET "status" = 'paid' WHERE "status" IN ('pago', 'paid');

-- ===== notas =====
ALTER TABLE "notas" ADD COLUMN IF NOT EXISTS "modulo_componente" INTEGER;
ALTER TABLE "notas" ADD COLUMN IF NOT EXISTS "boleto_taxa_id" TEXT;
DROP INDEX IF EXISTS "notas_aluno_id_disciplina_numero_prova_idx";
CREATE INDEX IF NOT EXISTS "notas_aluno_id_disciplina_modulo_componente_idx" ON "notas"("aluno_id", "disciplina", "modulo_componente");

-- ===== apostilas =====
ALTER TABLE "apostilas" ADD COLUMN IF NOT EXISTS "numero_modulo" INTEGER;
UPDATE "apostilas" SET "numero_modulo" = 2 WHERE "numero_modulo" IS NULL AND ("modulo" ILIKE '%II%' OR "modulo" ~ '2');
UPDATE "apostilas" SET "numero_modulo" = 1 WHERE "numero_modulo" IS NULL AND "modulo" IS NOT NULL;

-- ===== cronograma =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aulas_cronograma' AND column_name = 'numero_aula')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aulas_cronograma' AND column_name = 'modulo_componente') THEN
    ALTER TABLE "aulas_cronograma" RENAME COLUMN "numero_aula" TO "modulo_componente";
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aulas_cronograma' AND column_name = 'modulo_componente') THEN
    ALTER TABLE "aulas_cronograma" ADD COLUMN "modulo_componente" INTEGER;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "provas_cronograma_itens" (
  "id" TEXT NOT NULL,
  "prova_id" TEXT NOT NULL,
  "disciplina" TEXT NOT NULL,
  "modulo_componente" INTEGER,
  CONSTRAINT "provas_cronograma_itens_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "provas_cronograma_itens_prova_id_idx" ON "provas_cronograma_itens"("prova_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provas_cronograma_itens_prova_id_fkey') THEN
    ALTER TABLE "provas_cronograma_itens"
      ADD CONSTRAINT "provas_cronograma_itens_prova_id_fkey"
      FOREIGN KEY ("prova_id") REFERENCES "provas_cronograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- converte o array antigo de disciplinas em itens (só se a coluna antiga ainda existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provas_cronograma' AND column_name = 'disciplinas') THEN
    INSERT INTO "provas_cronograma_itens" ("id", "prova_id", "disciplina")
    SELECT md5(random()::text || clock_timestamp()::text || p."id" || s.subject), p."id", s.subject
    FROM "provas_cronograma" p, unnest(p."disciplinas") AS s(subject);
    ALTER TABLE "provas_cronograma" DROP COLUMN "disciplinas";
  END IF;
END $$;

-- ===== recuperação de senha =====
CREATE TABLE IF NOT EXISTS "redefinicoes_senha" (
  "id" TEXT NOT NULL,
  "aluno_id" TEXT NOT NULL,
  "codigo_hash" TEXT NOT NULL,
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "expira_em" TIMESTAMP(3) NOT NULL,
  "verificado_em" TIMESTAMP(3),
  "usado_em" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "redefinicoes_senha_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "redefinicoes_senha_aluno_id_idx" ON "redefinicoes_senha"("aluno_id");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'redefinicoes_senha_aluno_id_fkey') THEN
    ALTER TABLE "redefinicoes_senha"
      ADD CONSTRAINT "redefinicoes_senha_aluno_id_fkey"
      FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ===== solicitações de atestado/certificado =====
CREATE TABLE IF NOT EXISTS "solicitacoes_documentos" (
  "id" TEXT NOT NULL,
  "aluno_id" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "via" INTEGER NOT NULL,
  "valor_taxa" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "boleto_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ready',
  "solicitado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "emitido_em" TIMESTAMP(3),
  CONSTRAINT "solicitacoes_documentos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "solicitacoes_documentos_boleto_id_key" ON "solicitacoes_documentos"("boleto_id");
CREATE INDEX IF NOT EXISTS "solicitacoes_documentos_aluno_id_tipo_idx" ON "solicitacoes_documentos"("aluno_id", "tipo");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_documentos_aluno_id_fkey') THEN
    ALTER TABLE "solicitacoes_documentos"
      ADD CONSTRAINT "solicitacoes_documentos_aluno_id_fkey"
      FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitacoes_documentos_boleto_id_fkey') THEN
    ALTER TABLE "solicitacoes_documentos"
      ADD CONSTRAINT "solicitacoes_documentos_boleto_id_fkey"
      FOREIGN KEY ("boleto_id") REFERENCES "boletos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;