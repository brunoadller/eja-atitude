# Passo a passo — aplicar a atualização na pasta commitada

## 0) Antes de mexer
```bash
cd eja-plataforma            # raiz do projeto (a que tem client/ e server/)
git status                   # deixe limpo (commit/stash do que estiver pendente)
git checkout -b feature/jwt-modulos
```
> Se você alterou o atestado depois de me enviar o zip, **guarde seu texto**: o arquivo
> `server/src/modules/certificates/certificates.pdf.ts` traz o atestado com o texto que veio no zip.

## 1) Copiar os arquivos
Extraia `eja-atualizacao.zip` **na raiz do projeto**, aceitando substituir (os caminhos já são `server/...` e `client/...`).

Depois apague os arquivos que não existem mais:
```bash
rm server/src/modules/contracts/contracts.repository.ts
rm -r server/src/modules/grades/dto
rm -r server/src/modules/invoices/dto
rm client/src/pages/aluno/Documentos.tsx
```

## 2) Instalar dependências (workspaces: rode na RAIZ)
```bash
npm install jsonwebtoken express-rate-limit nodemailer -w server
npm install -D @types/jsonwebtoken @types/nodemailer tsc-alias -w server
npm install axios -w client
```

## 3) Configurar o `server/.env`
Copie as variáveis novas de `server/.env.example`. As obrigatórias:
```bash
# gerar o segredo do JWT (cole o resultado em JWT_SECRET)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
```env
JWT_SECRET=<resultado acima>
JWT_EXPIRES_IN=8h
SMTP_HOST=...        # em dev pode ficar vazio: o código aparece no terminal do servidor
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="EJA Atitude <nao-responder@seudominio.com.br>"
```

## 4) Banco de dados (migration)
```bash
cd server
npx prisma migrate deploy      # aplica 20261022000000_enrollment_jwt_modules
npx prisma generate
```
* Erro de CPF duplicado ao criar o índice único? Corrija os CPFs repetidos e rode de novo.
* Erro `P3005` (banco sem histórico)? Em **desenvolvimento** use `npx prisma migrate reset` (apaga os dados de teste e roda o seed).

## 5) Apostilas (módulo 1 = Livro 1, módulo 2 = Livro 2)
1. Extraia `apostilas-modulo1.zip` e copie os 11 PDFs `modulo1_*.pdf` para `server/uploads/apostilas/` (os do módulo 2 já estão lá).
2. Cadastre as 25 apostilas (idempotente, pode rodar de novo):
```bash
cd server
npm run seed            # cria o usuário da secretaria (usa ADMIN_USERNAME / ADMIN_PASSWORD do .env)
npm run seed:apostilas
```

## 6) Subir e testar
```bash
cd ..            # raiz
npm run dev      # front em http://localhost:5173
```
Roteiro de testes:
1. **Login secretaria** → Alunos → *Nova matrícula*: tente salvar vazio (deve listar os campos), depois preencha tudo, módulo 2, valor 199, 6 parcelas. Anote a **senha provisória** exibida.
2. **Boletos** → o aluno aparece com 6 parcelas → *Imprimir carnê completo* (3 vias por parcela).
3. **Cronograma** → Módulo 2 / 2026 → *Importar cronograma modelo 2026/2* (aulas + 7 provas) → *Baixar PDF*.
4. **Login aluno** (matrícula + senha provisória) → tela do contrato → aceitar → status vira **Ativo** → ver Cronograma (com PDF), Apostilas (só do módulo dele), Boletos.
5. **Esqueci minha senha** (na tela de login do aluno): CPF → código (no e-mail; em dev, no terminal do servidor) → nova senha digitada duas vezes. Teste também código errado e a senha antiga (deve parar de funcionar).
6. **Notas** (secretaria): lance uma nota < 5 → *Agendar recuperação* → lance a nota. A 2ª recuperação gera taxa de R$ 30 em Boletos.
7. **Atestado**: aluno pede a 1ª via (grátis, baixa na hora) → pede a 2ª (gera taxa R$ 30; só baixa depois de *Marcar pago* na secretaria).
8. **Certificado**: bloqueado mostrando os motivos; ao lançar ≥ 5,0 em todas as provas e quitar as parcelas, libera. Confira o PDF (2 páginas, modelo Unitec).

## 7) Build e deploy
```bash
npm run build     # client + server (prisma generate, tsc, tsc-alias)
npm start         # node server/dist/server.js
```
Variáveis em produção: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `TRUST_PROXY=1` (Render/Railway/Nginx), `ADMIN_PASSWORD` (antes do `npm run seed`).
Aplique as migrations no deploy: `npm --workspace server run db:deploy`.
Os PDFs de `server/uploads/apostilas/` precisam existir no servidor (a pasta não vai no git).

## 8) Commit
```bash
git add -A
git commit -m "feat: JWT, módulos 1/2, matrícula validada, parcelas e carnê, esqueci senha, certificado Unitec"
```
