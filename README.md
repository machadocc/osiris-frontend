# Osiris Web

Single-page application em React (JavaScript) que consome a [Osiris API](../backend), com Tailwind CSS para estilo, Axios para as requisições e suporte a PWA (instalável, com cache de assets).

## Rodando localmente

Requer Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173` e espera a API rodando em `VITE_API_URL` (padrão `http://localhost:8000/api`, ver `.env.example`).

## Build de produção

```bash
npm run build
npm run preview
```

## Rodando com Docker

```bash
docker build -t osiris-web .
docker run -p 5173:80 osiris-web
```

O `Dockerfile` faz build da aplicação e a serve com Nginx (multi-stage).

## Estrutura

```
src/
├── api/            # Instância Axios + funções por recurso (auth, categories, transactions, accounts, spendingLimits, savingsGoals, dashboard)
├── context/        # AuthContext (usuário/token) e ThemeContext (claro/escuro)
├── routes/         # ProtectedRoute: redireciona para /login quando não autenticado
├── components/     # Layout, Sidebar, Modal, ConfirmDialog, CategoryBadge, ReceiptInput, InstallPrompt, Logo
├── utils/          # receiptOcr.js: leitura automática (OCR) de comprovante no navegador
└── pages/          # Login, Register, Dashboard, Transactions, Categories, Accounts, SpendingLimits, SavingsGoals, Settings
```

## Autenticação

O token retornado pela API é salvo em `localStorage` e injetado automaticamente em todas as requisições pelo interceptor em `src/api/client.js`.
