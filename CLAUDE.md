# EJA Atitude — plataforma de gestão escolar (EJA / Ensino Médio)

Sistema para vender a instituições de ensino. Primeiro cliente: Escola de Ensino Médio Atitude Pelotas.
O dono está aprendendo: **explique cada mudança, em português, em passos pequenos, e diga como testar**.
Não reescreva o projeto inteiro; faça alterações pontuais e mostre o diff.

## Stack

- Monorepo npm workspaces: `client` (React + Vite + TypeScript + Tailwind) e `server` (Express + TypeScript).
- Banco: PostgreSQL no Neon, via Prisma **6.16.3 (versão fixa, não atualizar)**.
- Auth: JWT (cookie httpOnly + Bearer), bcrypt custo 12, helmet, express-rate-limit.
- PDFs: pdfkit. E-mail: nodemailer. Front HTTP: axios.

## Comandos (rodar na raiz, salvo indicação)

- `npm install` e `npm run dev` (sobe client em :5173 e server)
- Banco (em `server/`): `npx prisma migrate deploy` (aplicar), `npx prisma generate`, `npx prisma migrate dev --name <nome>` (SÓ para criar migration nova)
- Em pasta nova, rodar `npx prisma generate` em `server/` depois do `npm install`.
- Seeds (em `server/`): `npm run seed`, `npm run seed:apostilas`
- Checagem de tipos: `npx tsc --noEmit` em `client` e em `server`

## Git e ambientes

- Branches: `main` = pronto e testado (vai para produção); `dev` = trabalho do dia a dia.
- **Trabalhar na `dev` ou em `feature/<nome>` criada a partir dela. Nunca fazer commit direto na `main`.**
- Banco: o computador do dono usa a branch `dev` do Neon. A string de produção nunca fica no `.env` local; só nas variáveis do Render.
- Antes de qualquer migration: confirmar a branch git e a branch do Neon. Usar URL direta do Neon (sem `-pooler`).

## Regras invioláveis

- NUNCA rodar `prisma migrate reset` nem `db push --force-reset` (banco tem dados reais).
- NUNCA ler, imprimir ou commitar `.env`. Segredos só em variáveis de ambiente.
- Migrations sempre versionadas no git. Em outras máquinas e em produção: `migrate deploy`, nunca `migrate dev`.
- Antes de aplicar uma migration, mostrar o SQL e confirmar que não apaga dados.
- Não alterar o layout do PDF do atestado/certificado (`server/src/modules/certificates/certificates.service.ts`), exceto quando o pedido for explicitamente sobre o cabeçalho (nome e logo da escola).
- Não instalar dependência nova sem explicar o motivo.

## Convenções

- Camadas no server: route → controller → service → repository (Prisma), com DTOs, validação Zod e erros `AppError` centralizados.
- Imports com alias `@/` (tsconfig `paths`, sem `baseUrl`; build usa `tsc-alias`).
- **Colunas e nomes de código em inglês; textos da interface e dados exibidos em português.**
- Id de aluno é string aleatória (não expor quantidade de alunos).
- Status: seguir o padrão que o projeto já usa.
- Nome, razão social, logo e dados de cabeçalho da escola ficam em uma configuração central; nunca escrever o nome da escola direto no código ou nos PDFs.

## Variáveis de ambiente (`server/.env`, modelo em `.env.example`)

`DATABASE_URL`, `PORT`, `NODE_ENV`, `JWT_SECRET` (32+ caracteres, obrigatório), `JWT_EXPIRES_IN`,
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` (opcional), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
Sem SMTP e fora de produção, o código de recuperação de senha aparece no terminal como `[MAIL-DEV]`.
O seed cria o admin só se não existir; não redefine senha de admin existente.
Se o admin já existe e está sem e-mail, o seed preenche com `ADMIN_EMAIL`.

## Regras de negócio

- Módulos 1 e 2. **7 provas** por módulo; **uma nota por prova** (correção geral). As disciplinas só informam o que a prova cobre.
- Nota < 5,0 → recuperação (da prova inteira). Taxa de R$ 30 a partir da 2ª recuperação.
- Matrícula com 6 ou 12 parcelas; boletos com carnê de 3 vias; aceite de contrato pelo aluno.
- Cronograma de provas por turma/polo, com importação de modelo.
- Recuperação de senha: CPF + código enviado por e-mail.
- Trabalhar na branch dev . Nunca fazer commit direto na main
- Certificado e Diploma são o mesmo documento
- O aluno só consegue SOLICITAR O Certificado quando três condições forem verdadeiras: (1) notas: todas as provas com nota 5,0 ou mais e nehuma recuperação pendente; (2) boletos: todas as parcelas quitadas; (3) documentação: todos os documentos da lista aprovados pela secretaria.
- O aluno não baixa o certificado. A secretaria baixa, imprimime, assina e carimba o registro.
  -Documentos: o aluno envia pelo portal dele e a secretaria também pode anexar pelo portal dela. só a secretaria aprova ou recusa. se recusar, informa o motivo e o aluno reenvia. se a secretaria anexa e aprova, o status aparece na hora para o aluno.
- o aluno só vê os próprios documentos.
  mostre o que nudou no arquivo

### Certificado (diploma é o mesmo documento)

- O aluno só consegue **solicitar** quando três condições forem verdadeiras ao mesmo tempo: (1) notas: todas as provas com nota 5,0 ou mais e nenhuma recuperação pendente; (2) boletos: todas as parcelas quitadas; (3) documentação: todos os documentos da lista aprovados pela secretaria.
- A mesma validação vale no servidor, não só na tela. A tela do aluno mostra qual condição falta.
- O aluno **não baixa** o certificado. A secretaria baixa o PDF, imprime, assina e carimba para o registro.
- Atestado: 1ª via grátis, 2ª via gera taxa.

### Documentos dos alunos

- Status de cada documento: pendente, aprovado ou recusado.
- O aluno envia pelo portal dele; a secretaria também pode anexar pelo portal dela.
- Só a secretaria aprova ou recusa. Se recusar, informa o motivo e o aluno reenvia. Se a secretaria anexa e aprova, o status aparece na hora para o aluno.
- Guardar quem anexou, quem aprovou e quando.
- O aluno só vê os próprios documentos; rotas da secretaria exigem perfil de administrador.

### Identidade da escola (cabeçalho dos PDFs)

- Nome: Escola de Ensino Médio Atitude Pelotas. Razão social: Centro de Aprendizagem Atitude LTDA.
- Deliberação nº 409/2026 (substitui a anterior). Endereço: Andrade Neves 2288. Telefones: 30283591 e 96020080.
- CNPJ: a preencher. O logo substitui o "UNITEC" que aparecia no certificado; procurar "unitec" em todo o projeto.

## A CONFIRMAR com o dono (não assumir)

- CNPJ da escola, lista de documentos obrigatórios e se o logo "Escola Técnica Atitude Pelotas" é o que deve aparecer.
- Nomenclatura das turmas.
- Valores de taxas (R$ 30 / R$ 70) e juros (1% a.m. em `invoice.constants.ts`).
- Regra de troca de nota por prova.
- Hospedagem: Render (servidor) + Neon (banco); disco persistente do Render vs. Cloudflare R2 para uploads (`UPLOAD_DIR` ainda não é configurável).

## Armadilhas já vistas

- Admin sem login: `env.ts` sem `JWT_SECRET` (precisa validar JWT e SMTP com Zod).
- "3 migrations found"/drift: não resolver com reset; usar `migrate status` e `migrate resolve`.
- Pasta `uploads` fica em `server/uploads` e não vai para o git.
- `Cannot find module '.prisma/client/default'`: rodar `npx prisma generate` em `server/`.

## Forma de trabalhar

1. Para mudanças grandes, proponha um plano e espere aprovação antes de editar.
2. Faça uma coisa por vez, commit pequeno com mensagem clara em português.
3. Termine sempre com: o que mudou, como testar e o que pode quebrar.
