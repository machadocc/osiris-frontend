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

`VITE_VAPID_PUBLIC_KEY` (opcional) habilita o opt-in de notificações push em Configurações — precisa ser a mesma chave pública VAPID configurada no back-end (ver `backend/README.md`). Sem ela, o resto do app funciona normalmente, só o cartão de notificações fica sem efeito.

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
├── api/            # Instância Axios + funções por recurso (auth, categories, transactions, accounts, spendingLimits,
│                   #   savingsGoals, recurringTransactions, pushSubscriptions, reports, dashboard)
├── context/        # AuthContext (usuário/token) e ThemeContext (claro/escuro)
├── routes/         # ProtectedRoute: redireciona para /login quando não autenticado
├── components/     # Layout, Sidebar, Modal, ConfirmDialog, CategoryBadge, ReceiptInput, InstallPrompt, Logo,
│                   #   Spinner, NotificationsCard (opt-in de push), HealthScoreCard (índice de saúde financeira)
├── utils/          # receiptOcr.js (OCR de comprovante), webPush.js (conversão de chave VAPID),
│                   #   quickAddParser.js (adição rápida por texto livre)
├── sw.js           # Service worker customizado (injectManifest): cache de assets + push/notificationclick
└── pages/          # Login, Register, Dashboard, Transactions, Categories, Accounts, SpendingLimits, SavingsGoals,
                     #   RecurringTransactions, Compare (comparar dois meses), Settings
```

O service worker é customizado (`src/sw.js`, estratégia `injectManifest` do `vite-plugin-pwa`) em vez do padrão gerado automaticamente, porque precisa dos listeners `push` e `notificationclick` para as notificações de limite de gastos estourado (ver `backend/README.md`, seção de notificações push).

## Autenticação

O token retornado pela API é salvo em `localStorage` e injetado automaticamente em todas as requisições pelo interceptor em `src/api/client.js`.
