# Roadmap

## Feito
- Senha da secretaria: troca estando logada, "esqueci a senha" por código no e-mail e tela "Minha conta" (na `dev`).
- `.gitattributes`: migrations do Prisma sempre com quebra de linha LF.
- Documentos dos alunos: status pendente/aprovado/recusado, motivo da recusa, anexo pela secretaria (com "já aprovar"), registro de quem anexou e quem analisou.
- 5.3 Certificado (= diploma): o aluno só solicita com notas, parcelas e documentos obrigatórios (todos exceto Reservista) em dia,
  com validação no servidor; tela Diploma mostra as três etapas; o aluno não baixa; tela Certificados da secretaria
  (baixar PDF e marcar como emitido, com registro de quem emitiu); status "Concluído" automático com notas e documentos
  em dia (só sobe, nunca volta sozinho); situação do aluno no Dashboard.

## Próximos pedidos
- 5.4: cabeçalho dos PDFs com nome e logo da escola (configuração central). Hoje o certificado ainda mostra
  "ESCOLA TÉCNICA UNITEC - JAGUARÃO" e o `server/assets/logo-unitec.png` foi apagado localmente (o PDF sai sem o logo do canto).
- A confirmar: regra das notas. O CLAUDE.md diz "uma nota por prova (correção geral)", mas o sistema lança e confere
  nota por disciplina dentro de cada prova (5,0 em cada uma). Mantido assim no 5.3; mudar mexe no lançamento de notas.
- Ideia: avisar o aluno por e-mail quando um documento for aprovado/recusado ou o certificado for emitido.

## Antes do deploy em produção
1. No Neon, criar uma branch de backup a partir da produção.
2. No SQL Editor da produção, marcar como revertida a migration com falha `20261022013946_fase1_jwt_modulos_cobrancas`:
   `UPDATE _prisma_migrations SET rolled_back_at = now() WHERE migration_name = '20261022013946_fase1_jwt_modulos_cobrancas' AND finished_at IS NULL AND rolled_back_at IS NULL;`
3. Na produção, ver quantos documentos têm status `'pendente'` antes de aplicar a migration `20261111180000_document_uploaded_reviewed_by`, que troca esse valor por `'pending'`:
   `SELECT status, COUNT(*) FROM documentos_aluno GROUP BY status;`
4. Na produção, ver as solicitações de certificado: as "ready" passam a esperar a secretaria marcar como emitidas
   (antes o próprio aluno baixava e isso contava como emitido):
   `SELECT tipo, status, COUNT(*) FROM solicitacoes_documentos GROUP BY tipo, status;`
5. No Render: Pre-Deploy Command `npm --workspace server run db:deploy` e a variável `ADMIN_EMAIL`.
