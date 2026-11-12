# Roadmap

## Feito
- Senha da secretaria: troca estando logada, "esqueci a senha" por código no e-mail e tela "Minha conta" (na `dev`).
- `.gitattributes`: migrations do Prisma sempre com quebra de linha LF.
- Documentos dos alunos: status pendente/aprovado/recusado, motivo da recusa, anexo pela secretaria (com "já aprovar"), registro de quem anexou e quem analisou.

## Próximos pedidos
- 5.3: lista de documentos obrigatórios e o certificado passar a exigir que todos estejam aprovados.
  Hoje o `server/src/modules/grades/completion.service.ts` só confere notas e parcelas, e o CLAUDE.md exige também a documentação aprovada.
- A confirmar: regra das notas. O CLAUDE.md diz "uma nota por prova (correção geral)", mas o sistema lança e confere
  nota por disciplina dentro de cada prova (5,0 em cada uma). Mantido assim no 5.3; mudar mexe no lançamento de notas.

## Antes do deploy em produção
1. No Neon, criar uma branch de backup a partir da produção.
2. No SQL Editor da produção, marcar como revertida a migration com falha `20261022013946_fase1_jwt_modulos_cobrancas`:
   `UPDATE _prisma_migrations SET rolled_back_at = now() WHERE migration_name = '20261022013946_fase1_jwt_modulos_cobrancas' AND finished_at IS NULL AND rolled_back_at IS NULL;`
3. Na produção, ver quantos documentos têm status `'pendente'` antes de aplicar a migration `20261111180000_document_uploaded_reviewed_by`, que troca esse valor por `'pending'`:
   `SELECT status, COUNT(*) FROM documentos_aluno GROUP BY status;`
4. No Render: Pre-Deploy Command `npm --workspace server run db:deploy` e a variável `ADMIN_EMAIL`.
