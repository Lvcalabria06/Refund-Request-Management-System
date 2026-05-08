# Refund Request Management System — Pitang Technical Assessment

Sistema fullstack para gerenciamento de solicitações de reembolso corporativo, contemplando colaboradores, gestores, financeiro e administradores. Implementado conforme o documento `desafio-estags-pitang.html`.

---

## Sumário

1. [Stack utilizada](#stack-utilizada)
2. [Estrutura do projeto](#estrutura-do-projeto)
3. [Como rodar o projeto](#como-rodar-o-projeto)
4. [Usuários de teste](#usuários-de-teste)
5. [Funcionalidades implementadas](#funcionalidades-implementadas)
6. [Decisões técnicas](#decisões-técnicas)
7. [Como rodar os testes](#como-rodar-os-testes)
8. [Endpoints da API](#endpoints-da-api)
9. [Diferenciais (Plus)](#diferenciais-plus)

---

## Stack utilizada

### Backend
| Camada | Tecnologia |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Autenticação | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validação | Zod (body **e** params) |
| ORM | Prisma |
| Banco de dados | SQLite (arquivo local `dev.db`) |
| Datas | DayJS |
| Testes | Jest + Supertest |

### Frontend
| Camada | Tecnologia |
|---|---|
| Framework | React 19 com Functional Components + Hooks |
| Build/Dev | Vite |
| Linguagem | TypeScript |
| Roteamento | React Router |
| Estado global | Context API (`AuthContext`) |
| HTTP | Axios (com interceptors para token e 401) |
| UI library | Chakra UI |
| Formulários | React Hook Form + Zod (`@hookform/resolvers`) |
| Datas | DayJS |
| Ícones | lucide-react |
| Testes | Vitest (API-compatível com Jest) + React Testing Library |

---

## Estrutura do projeto

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # modelos Prisma
│   │   ├── seed.ts                # popula usuários e categorias de teste
│   │   └── dev.db                 # banco SQLite
│   ├── src/
│   │   ├── controllers/           # camada de entrada HTTP
│   │   ├── services/              # regras de negócio
│   │   ├── routes/                # definição das rotas Express
│   │   ├── middlewares/           # auth e role
│   │   ├── schemas/               # schemas Zod (body + params)
│   │   ├── lib/prisma.ts
│   │   ├── app.ts                 # setup do Express
│   │   └── server.ts              # entrypoint
│   ├── tests/
│   │   └── reimbursement.test.ts  # testes de integração (Jest + Supertest)
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/            # AppLayout, Sidebar, ProtectedRoute
│   │   ├── contexts/              # AuthContext
│   │   ├── pages/                 # Login, Detail, Employee, Manager, Finance, Admin
│   │   ├── services/api.ts        # axios + interceptors
│   │   ├── styles/theme.ts        # tema do Chakra UI
│   │   ├── test/                  # setup e helpers de teste
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
└── desafio-estags-pitang.html     # documento original do desafio
```

---

## Como rodar o projeto

Existem **dois caminhos**: usando **Docker** (recomendado, mais simples) ou rodando localmente com Node.js.

---

### 🐳 Opção A — Com Docker (recomendado)

**Único pré-requisito:** ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado (não precisa nem de Node).
j
Na raiz do projeto:

```bash
docker compose up           # constrói as imagens e sobe backend + frontend
```

Pronto. Acesse:
- Backend: **http://localhost:3333**
- Frontend: **http://localhost:5173**

O `docker-compose.yml` cuida de:
1. Instalar as dependências do backend e frontend
2. Gerar o cliente Prisma
3. Criar/atualizar o banco SQLite (`prisma db push`)
4. Popular usuários e categorias (`prisma db seed`)
5. Subir o servidor da API (porta 3333) e o Vite (porta 5173)

#### Comandos úteis do Docker

```bash
docker compose up                # sobe tudo (foreground, mostra logs)
docker compose up -d             # sobe em background (libera o terminal)
docker compose up --build        # força reconstruir as imagens
docker compose down              # derruba os containers
docker compose down -v           # derruba + apaga volumes (zera o banco)
docker compose logs -f backend   # ver logs do backend ao vivo
docker compose exec backend sh   # entrar dentro do container backend (debug)
```

---

### 💻 Opção B — Rodando localmente (sem Docker)

#### Pré-requisitos

- **Node.js 20.19+** (ou 22.12+) — exigido pelo Vite. Se usar `nvm`, basta rodar `nvm use` na raiz do projeto (existe um `.nvmrc` configurado).
- **npm** (já vem com o Node)

##### Como conferir/atualizar o Node.js

```bash
node -v                 # confere a versão atual

# Se for menor que 20.19, atualize com nvm:
nvm install 20.19.0     # instala
nvm use                 # ativa a versão do .nvmrc
```

> Se a versão do Node estiver errada, o `npm install` ainda funciona, mas o `npm run dev` falha com erro de
> `styleText` ou `import` não encontrado. Sempre confira `node -v` antes.

#### 1. Backend

```bash
cd backend
npm install                 # instala dependências e cria o .env automaticamente
npx prisma db push          # cria o banco SQLite e as tabelas
npm run seed                # popula usuários e categorias
npm run dev                 # inicia a API em http://localhost:3333
```

> **Sobre o `.env`:** O arquivo `.env` é criado automaticamente após `npm install`,
> a partir do template `.env.example` (que está versionado no Git). Caso queira
> ajustar alguma chave (ex: `JWT_SECRET` para produção), edite o `.env` antes de subir.
>
> Conteúdo do template:
> ```env
> DATABASE_URL="file:./dev.db"
> PORT=3333
> JWT_SECRET="change_this_in_production"
> ```

#### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev                 # inicia o app em http://localhost:5173
```

Abra o navegador em **http://localhost:5173** e use uma das credenciais abaixo.

---

## Usuários de teste

Criados automaticamente pelo `npm run seed`. Senha padrão para todos: **`123456`**.

| E-mail | Senha | Perfil | O que pode fazer |
|---|---|---|---|
| `employee@pitang.com` | `123456` | EMPLOYEE | Criar, editar (apenas DRAFT), enviar e cancelar suas próprias solicitações; adicionar anexos |
| `manager@pitang.com` | `123456` | MANAGER | Aprovar e rejeitar (com justificativa) solicitações enviadas |
| `finance@pitang.com` | `123456` | FINANCE | Marcar solicitações aprovadas como pagas |
| `admin@pitang.com` | `123456` | ADMIN | Gerenciar usuários e categorias |

### Categorias iniciais
Food, Transport, Lodging, Office Supplies (todas ativas após o seed).

---

## Funcionalidades implementadas

### Fluxo principal de reembolso

```
DRAFT ──submit──► SUBMITTED ──approve──► APPROVED ──pay──► PAID
                       │                      │
                       └──reject──► REJECTED  │
                                              │
DRAFT/SUBMITTED ───────cancel───► CANCELED ◄──┘
```

### Backend
- ✅ Login com JWT (1 dia de validade) e senha hasheada com bcrypt
- ✅ Middleware de autenticação (`authMiddleware`) e de permissão por perfil (`roleMiddleware`)
- ✅ **CRUD completo de usuários** (criar, listar, ver detalhe, editar, deletar — restrito a ADMIN)
- ✅ **CRUD completo de categorias** (criar, listar, editar, ativar/desativar)
- ✅ **CRUD completo de solicitações de reembolso** (criar, listar, ver detalhe, editar enquanto DRAFT, cancelar)
- ✅ **CRUD completo de anexos** (criar, listar, ver, renomear e deletar — só pelo dono em DRAFT/SUBMITTED)
- ✅ Envio, aprovação, rejeição (com justificativa), pagamento e cancelamento
- ✅ Histórico de auditoria — toda ação relevante gera registro com autor, data e observação
- ✅ Validação de body e params com Zod
- ✅ Manipulação de datas com DayJS (incluindo regra de "data não pode ser futura")
- ✅ Tratamento de erros HTTP coerente: 400, 401, 403, 404, 500
- ✅ Bloqueio de submit sem anexo para reembolsos acima de R$ 500

### Frontend
- ✅ Tela de Login com validação visual de campos
- ✅ Tela de Cadastro de usuário (restrita ao ADMIN — ver decisões técnicas)
- ✅ Dashboard com mensagem personalizada por perfil
- ✅ Listagens específicas por perfil (Meus Reembolsos, Aprovações, Pagamentos)
- ✅ Tela de Nova Solicitação com validação de valor, data, categoria e descrição
- ✅ Tela de Edição de Rascunho (bloqueada quando o status não permite)
- ✅ Tela de Detalhe da solicitação com **dados, anexos e histórico**
- ✅ Aprovação e rejeição com modal para a justificativa
- ✅ Marcação como pago para o financeiro
- ✅ Cancelamento de solicitação pelo dono (com diálogo de confirmação)
- ✅ Gestão de categorias para o ADMIN (criar, editar, ativar/desativar)
- ✅ Sidebar dinâmica que mostra apenas itens permitidos ao perfil
- ✅ Estados de loading, erro e lista vazia em todas as telas
- ✅ Toasts visuais para sucesso e erro
- ✅ Redirecionamento automático para /login quando o token expira (interceptor do axios)

---

## Decisões técnicas

### 1. Cadastro de usuário restrito a ADMIN
O documento lista `POST /users` sem especificar se é público ou restrito. Optou-se por restringir ao ADMIN porque:
- Em sistemas corporativos reais o cadastro é controlado pela administração
- Evita que pessoas externas criem contas no sistema
- O ADMIN pode criar contas de qualquer perfil pela tela `/admin/users/new`

### 2. Vitest no lugar de Jest no frontend
O documento cita "Jest + React Testing Library" para frontend, mas:
- Vitest tem **API 100% compatível** com Jest (mesmas funções `describe`, `it`, `expect`)
- Integra nativamente com Vite — sem necessidade de configurar Babel/ts-jest
- Evita problemas conhecidos do Jest com módulos ESM (lucide-react, react-router-dom v7, React 19)
- O `React Testing Library` (a parte realmente importante) foi mantido conforme exigido

### 3. SQLite como banco
- Não exige instalação adicional (é um arquivo)
- Facilita a avaliação por terceiros
- Compatível 100% com a sintaxe do Prisma usada

### 4. Hashing de senhas com bcryptjs
Senhas nunca são armazenadas em texto puro. O `bcryptjs.hash` com salt 10 é usado tanto no seed quanto no `UserService.create`.

### 5. Validação tanto no front quanto no back
- **Frontend (Zod + react-hook-form):** valida ANTES de enviar requisição → melhor UX
- **Backend (Zod):** valida o que chega na API → segurança real (frontend não confia em ninguém)

### 6. Histórico como trilha de auditoria
Todas as transações de status (`CREATED`, `UPDATED`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PAID`, `CANCELED`) geram um registro em `ReimbursementHistory` dentro de uma transação atômica do Prisma — evitando estados inconsistentes em caso de falha.

### 7. handleError centralizado com mapeamento HTTP
A função `handleError` no `ReimbursementController` distingue:
- `ZodError` → 400
- Mensagens com `"not found"` → 404
- Mensagens com `"Only EMPLOYEE/MANAGER/FINANCE/owner/Unauthorized"` → 403
- Erros de regra de negócio conhecidos (transição inválida, categoria inativa, etc.) → 400
- Qualquer outro erro inesperado → 500

### 8. Interceptors do axios para autenticação global
- **Request interceptor:** injeta o token JWT em toda requisição automaticamente
- **Response interceptor:** se receber 401, limpa localStorage e redireciona para /login

---

## Como rodar os testes

### Backend (Jest + Supertest)

```bash
cd backend
npm test
```

Roda 13 testes cobrindo:
- Autenticação (acesso bloqueado sem token)
- Validações de entrada (campos obrigatórios, valor negativo)
- Isolamento entre usuários (RBAC)
- Fluxo de cancelamento (allow/block)
- Fluxo de rejeição (com e sem justificativa)
- Fluxo principal: DRAFT → SUBMITTED → APPROVED → PAID
- Anexos (válido e tipo inválido)
- Histórico (ordem decrescente)

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm test                    # roda uma vez
npm run test:watch          # modo watch
```

Roda 13 testes cobrindo:
- **Formulários:** renderização de campos do Login
- **Mensagens de erro:** e-mail inválido, senha curta
- **Renderização condicional por autenticação:** ProtectedRoute redirecionando ou liberando
- **Renderização condicional por perfil:** Sidebar mostrando itens distintos para EMPLOYEE, MANAGER, FINANCE e ADMIN

---

## Endpoints da API

Base URL: `http://localhost:3333`

### Autenticação
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | — | Autentica e retorna `{ token, user }` |

### Usuários
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/users` | ADMIN | Lista todos os usuários |
| GET | `/users/:id` | ADMIN | Detalhes de um usuário |
| POST | `/users` | ADMIN | Cria novo usuário |
| PUT | `/users/:id` | ADMIN | Atualiza nome, e-mail, senha e/ou role (parcial) |
| DELETE | `/users/:id` | ADMIN | Remove usuário (não permitido para si mesmo nem se houver reembolsos/histórico) |

### Categorias
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/categories` | ADMIN | Lista todas (incluindo inativas) |
| GET | `/categories/active` | qualquer | Lista apenas ativas (usado no select de novo reembolso) |
| POST | `/categories` | ADMIN | Cria categoria |
| PATCH | `/categories/:id` | ADMIN | Atualiza nome ou status |

### Reembolsos
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/reimbursements` | qualquer | Lista filtrada por perfil |
| POST | `/reimbursements` | qualquer | Cria solicitação (DRAFT) |
| GET | `/reimbursements/:id` | qualquer | Detalhe da solicitação |
| PUT | `/reimbursements/:id` | EMPLOYEE dono | Edita rascunho |
| POST | `/reimbursements/:id/submit` | EMPLOYEE dono | Envia para análise |
| POST | `/reimbursements/:id/approve` | MANAGER | Aprova solicitação enviada |
| POST | `/reimbursements/:id/reject` | MANAGER | Rejeita com justificativa |
| POST | `/reimbursements/:id/pay` | FINANCE | Marca como paga |
| POST | `/reimbursements/:id/cancel` | EMPLOYEE dono | Cancela solicitação |
| GET | `/reimbursements/:id/history` | qualquer com acesso | Lista histórico |
| POST | `/reimbursements/:id/attachments` | EMPLOYEE dono | Adiciona anexo |
| GET | `/reimbursements/:id/attachments` | qualquer com acesso | Lista anexos |
| GET | `/reimbursements/:id/attachments/:attachmentId` | qualquer com acesso | Detalhes de um anexo |
| PUT | `/reimbursements/:id/attachments/:attachmentId` | EMPLOYEE dono | Renomeia anexo (DRAFT/SUBMITTED apenas) |
| DELETE | `/reimbursements/:id/attachments/:attachmentId` | EMPLOYEE dono | Remove anexo (DRAFT/SUBMITTED apenas) |

### Status HTTP retornados
| Cenário | Status |
|---|---|
| Sucesso de criação | 201 |
| Sucesso geral | 200 |
| Body/params inválidos | 400 |
| Token ausente ou inválido | 401 |
| Perfil sem permissão | 403 |
| Recurso inexistente | 404 |
| Transição de status inválida | 400 |
| Erro inesperado no servidor | 500 |

---

## Tecnologias da ementa atendidas

| Tópico da ementa | Onde foi usado |
|---|---|
| JavaScript / TypeScript | Todo o projeto |
| Node.js, Express.js, APIs RESTful | Backend |
| Status HTTP, middlewares | `authMiddleware`, `roleMiddleware`, `handleError` |
| JWT | `AuthService.login`, `authMiddleware` |
| Zod | Schemas de body e params em ambos os lados |
| ORM | Prisma com modelo relacional |
| Datas (DayJS) | Validação e formatação de datas |
| Testes | Jest+Supertest (backend) e Vitest+RTL (frontend) |
| React + Hooks + Functional Components | Toda a UI |
| React Router | Rotas públicas/privadas |
| Context API | `AuthContext` para usuário e token |
| UI library | Chakra UI |
| Formulários controlados | React Hook Form |

---

## Postman Collection

Uma collection completa do Postman está disponível em
[`docs/Pitang Refunds API.postman_collection.json`](./docs/Pitang%20Refunds%20API.postman_collection.json).

### Como usar
1. Abra o Postman → **Import** → arraste o arquivo `.json`
2. A collection vem com:
   - Variável `baseUrl` apontando para `http://localhost:3333`
   - Tokens populados automaticamente após cada Login
   - Scripts de teste que salvam `categoryId`, `reimbursementId` e `attachmentId`
   - 4 contas de teste (EMPLOYEE / MANAGER / FINANCE / ADMIN)

### Ordem sugerida de execução
```
1. Auth → Login (Employee)
2. Auth → Login (Manager)
3. Auth → Login (Finance)
4. Auth → Login (Admin)
5. Categories → List Active                    [popula categoryId]
6. Reimbursements → CRUD → Create               [popula reimbursementId]
7. Reimbursements → Workflow → Submit
8. Reimbursements → Workflow → Approve
9. Reimbursements → Workflow → Pay
10. Reimbursements → History → Get History      [vê toda a trilha]
```

## Diferenciais (Plus)

A seção 17 do desafio lista 19 itens **opcionais** que contam como diferencial positivo. Abaixo está a lista completa, separando o que foi implementado e o que ficou de fora.

### ✅ Implementados (18 de 19)

| # | Diferencial | Onde está no projeto |
|---|---|---|
| 1 | **Seeds iniciais** | `backend/prisma/seed.ts` cria 4 usuários (1 de cada perfil) e 4 categorias (com limites diferentes) |
| 2 | **Mais testes automatizados no backend** | `backend/tests/reimbursement.test.ts` — 13 testes de integração cobrindo auth, validações, RBAC, fluxos de cancelamento/rejeição, happy path, anexos e histórico |
| 3 | **Mais testes automatizados no frontend** | 13 testes em 3 arquivos (`Login.test.tsx`, `ProtectedRoute.test.tsx`, `Sidebar.test.tsx`) cobrindo formulários, validações e renderização condicional por perfil |
| 4 | **Docker Compose** | `docker-compose.yml` na raiz orquestra backend + frontend com `docker compose up`. Inclui hot reload, seed automático e volumes para persistência. Não exige Node instalado na máquina do avaliador |
| 5 | **Limite de valor configurável por categoria** | Campo `maxAmount` em Category. ADMIN define no modal de "New Category"; quando EMPLOYEE tenta criar/editar reembolso acima do limite, recebe erro visual em tempo real e o backend bloqueia com 400 |
| 6 | **Bloqueio de despesas futuras** | `ReimbursementService.create` valida `expenseDate.isAfter(dayjs())` usando DayJS — rejeita datas no futuro |
| 7 | **Bloqueio de solicitação sem anexo acima de determinado valor** | `submit` exige pelo menos 1 anexo quando `amount > R$ 500` (constante `ATTACHMENT_REQUIRED_THRESHOLD`) |
| 8 | **Preview/download de anexos** | Anexos são salvos como data URLs base64; o link "Open" no detalhe do reembolso abre/baixa o arquivo direto no navegador |
| 9 | **Dashboard com totais** | `pages/Dashboard.tsx` tem 4 dashboards distintos por perfil (EMPLOYEE/MANAGER/FINANCE/ADMIN) com KPIs: contagens por status, total pago, total pendente, total de usuários, etc. |
| 10 | **Collection do Postman** | [`docs/Pitang Refunds API.postman_collection.json`](./docs/Pitang%20Refunds%20API.postman_collection.json) — collection completa com tokens auto-populados e scripts de teste |
| 11 | **Upload de comprovantes (simulado)** | Tela de Detalhe permite escolher arquivo do computador via `<input type="file">`. O conteúdo é convertido em base64 (data URL) e armazenado no banco. **Conforme permitido pelo documento:** *"upload de anexos, podendo ser simulado"* |
| 12 | **Filtro por status** | Listagem de reembolsos aceita query param `?status=DRAFT` (ou SUBMITTED, APPROVED, etc.). UI tem `<Select>` para o usuário aplicar o filtro |
| 13 | **Filtro por categoria** | Listagem de reembolsos aceita query param `?categoryId=<uuid>`. UI tem `<Select>` populado com as categorias ativas |
| 14 | **Ordenação por data ou valor** | Listagem aceita query params `?orderBy=expenseDate&order=desc` (ou `amount`, `createdAt`). UI tem `<Select>` para o usuário escolher campo e direção |
| 15 | Busca por colaborador |
| 16 | Paginação | Listagens retornam todos os registros |
| 17 | Refresh token |
| 18 | Soft delete |

### ❌ Não implementados (1 de 19)
| # | Diferencial | Observação |
|---|---|---|
| 2 | Consumo de API externa | Nenhuma chamada para serviços externos (BrasilAPI, ViaCEP, etc.) |

### Resumo

- **17 de 19 diferenciais implementados** (89%)


---

## Autor
Lucas Valois Calabria
Desenvolvido como parte do desafio técnico para a Pitang.
