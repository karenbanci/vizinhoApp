# 🏡 Vizinho App

> Conectando vizinhos e serviços de confiança na sua comunidade.

O **Vizinho** é uma plataforma web que facilita encontrar, contratar e oferecer serviços de proximidade (manicure, dog sitter, bolos & confeitaria, faxina, reparos e muito mais), com foco na comunidade brasileira e internacional.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19** & **TypeScript**
- **Tailwind CSS v4** (com `@tailwindcss/vite`)
- **Vite 8**
- **Ícones e Design Responsivo**

### Backend & Banco de Dados
- **Node.js (ES Modules)**
- **Express 5**
- **MySQL 8** (com `mysql2/promise`)
- **JWT (JSON Web Tokens)** & **Bcrypt.js** para autenticação e senhas seguras
- **CORS** & **Dotenv**

---

## 📁 Estrutura do Projeto

```text
vizinhoApp/
├── mysql-data/          # Dados da instância MySQL local dedicada
├── scripts/             # Automações de banco de dados e ferramentas
│   ├── db-start.mjs     # Inicia o MySQL local na porta 3307
│   ├── db-setup.mjs     # Criação de schemas, tabelas e migrações
│   ├── db-stop.mjs      # Encerra o processo do MySQL local
│   └── db-workbench.mjs # Abre o MySQL Workbench conectado ao projeto
├── server/              # Backend Express
│   ├── routes/
│   │   ├── admin.mjs    # Painel interno e redefinição de senhas
│   │   ├── auth.mjs     # Login, cadastro e recuperação de senha
│   │   ├── me.mjs       # Perfil do usuário e ativação como prestador
│   │   └── providers.mjs# Listagem pública de prestadores
│   ├── auth.mjs         # Middlewares JWT
│   ├── db.mjs           # Pool de conexões MySQL
│   ├── index.mjs        # Ponto de entrada do servidor Node (porta 3001)
│   └── users.mjs        # Helpers e serializadores de dados
├── src/                 # Frontend React
│   ├── components/      # Modais de Auth, Drawer de Perfil, Cards
│   ├── pages/
│   │   ├── AdminPage.tsx    # Painel Administrativo de Usuários e Senhas
│   │   ├── ExplorePage.tsx  # Catálogo e busca de prestadores
│   │   └── ProfilePage.tsx  # Perfil do usuário e configurações de prestador
│   ├── api.ts           # Cliente HTTP e integração com a API
│   ├── App.tsx          # Componente raiz e roteamento de visualizações
│   └── main.tsx         # Ponto de entrada da aplicação
├── .env.example         # Exemplo das variáveis de ambiente
├── package.json         # Dependências e scripts de execução
└── vite.config.ts       # Configuração do Vite com proxy para /api
```

---

## ⚙️ Pré-requisitos

- **Node.js** (versão 20 ou superior recomendada)
- **pnpm** ou **npm**
- **MySQL Server** (ou utilizar a instância local gerenciada pelos scripts)
- **MySQL Workbench** (opcional, para visualização de dados)

---

## 🛠️ Instalação e Configuração

### 1. Clonar o repositório e instalar as dependências
```bash
# Instalar dependências do projeto
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Conteúdo padrão do `.env`:
```env
# Banco de dados local do projeto
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=vizinho_app
DB_PASS=vizinho123
DB_NAME=vizinho

# Servidor Node
PORT=3001
JWT_SECRET=troque-por-um-segredo-forte
```

---

## ▶️ Como Executar o Projeto

Você precisará de 3 partes ativas durante o desenvolvimento:

### 1. Iniciar e Configurar o Banco de Dados MySQL
```bash
# Inicia a instância local do MySQL na porta 3307
npm run db:start

# Cria o schema, tabelas e migrações necessárias
npm run db:setup
```

### 2. Iniciar a API Backend (Porta 3001)
```bash
npm run server
```

### 3. Iniciar o Frontend Vite (Porta 8443)
```bash
npm run dev
```

Abra seu navegador em [http://localhost:8443](http://localhost:8443).

---

## 🐬 Conexão com o MySQL Workbench

O projeto inclui uma instância isolada do MySQL na porta **`3307`** para evitar conflitos com outros bancos.

### Opção A: Abertura Automática
```bash
npm run db:workbench
```

### Opção B: Conexão Manual
- **Connection Name:** `Vizinho App Local`
- **Hostname:** `127.0.0.1`
- **Port:** `3307`
- **Username:** `vizinho_app`
- **Password:** `vizinho123`
- **Default Schema:** `vizinho`

---

## 🛡️ Painel Administrativo Interno

O sistema conta com um painel interno dedicado para suporte ao cliente e redefinição de senhas:

- **Acesso:** Clique no botão **`🛡️ Admin`** no menu superior ou acesse [http://localhost:8443/?admin=1](http://localhost:8443/?admin=1).
- **Recursos:**
  - 👥 **Listagem e Busca de Usuários**: Filtro instantâneo por nome ou e-mail.
  - 🔑 **Redefinição Direta de Senha**: Com gerador integrado de senhas fortes (`🎲 Gerar Senha Segura`).
  - 🔗 **Geração de Links de Reset**: Criação de tokens temporários (1h) e mensagens formatadas para WhatsApp/E-mail.
  - ⚡ **Reset Rápido por E-mail**: Troca imediata informando apenas o e-mail do usuário.
  - 📋 **Histórico de Links e Tokens**: Acompanhamento de links válidos, expirados ou utilizados.
  - 📊 **Métricas**: Estatísticas de usuários, prestadores e solicitações de recuperação.

---

## 📜 Comandos Disponíveis (`package.json`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite (Frontend) |
| `npm run server` | Inicia a API Express (Backend) |
| `npm run build` | Compila o frontend para produção (`dist/`) |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run db:start` | Inicia a instância local do MySQL (porta 3307) |
| `npm run db:setup` | Cria o banco, usuário e tabelas no MySQL |
| `npm run db:stop` | Encerra o processo do MySQL local |
| `npm run db:workbench` | Inicia o MySQL e abre o Workbench automaticamente |

---

## 🌐 Endpoints Principais da API

### Autenticação (`/api/auth`)
- `POST /api/auth/register` - Cadastro de novos usuários
- `POST /api/auth/login` - Autenticação e emissão de token JWT
- `GET  /api/auth/me` - Dados do usuário logado
- `POST /api/auth/forgot-password` - Solicitação pública de redefinição de senha
- `POST /api/auth/reset-password` - Redefinição com token válido

### Perfil do Usuário (`/api/me`)
- `PATCH  /api/me` - Atualização de nome e e-mail
- `POST   /api/me/provider` - Ativação do perfil de prestador
- `PATCH  /api/me/provider` - Atualização dos serviços, localização e biografia
- `DELETE /api/me/provider` - Desativação do perfil de prestador

### Prestadores Públicos (`/api/providers`)
- `GET /api/providers` - Lista todos os prestadores ativos

### Painel Admin (`/api/admin`)
- `GET  /api/admin/users` - Lista usuários com suporte a filtro `?search=`
- `GET  /api/admin/stats` - Métricas gerais da base de usuários
- `GET  /api/admin/tokens` - Histórico de tokens de reset gerados
- `POST /api/admin/users/reset-password` - Redefinição direta de senha
- `POST /api/admin/users/generate-reset-link` - Geração direta de link de redefinição

---

## 📄 Licença

Este projeto é de uso privado e confidencial.


# Bugs
- [x] quando clico em login as mensagens de erro na página em inglês estão em português, traduzir todas as mensagens de erro em todas as páginas que estiverem em inglês
- [x] arrumar esse erro Testing domain restriction: The resend.dev domain is for testing and can only send to your own email address. To send to other recipients, verify a domain and update the from address to use it.
- [x] Ao fazer cadastro gostaria que a o usuário tivesse a opção de vincular a conta do google.
- [x] Ao fazer cadastro o usuário tenha a opção de escolher somente a conta de cliente ou a conta de prestador de serviço. Quando escolher a conta prestador de serviço esse usuário seja cliente automaticamente. Mas ao ser cliente não ter a opção de pestador de serviço. Então separar esses dois tipos de perfis
- [x] Na página em inglês de explore as mensagem e opções de filtros aparecem em português, traduza tudo para inglês: Explorar prestadores. Encontre todos os profissionais disponíveis de acordo com a sua região.
