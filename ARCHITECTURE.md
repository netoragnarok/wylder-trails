# ARCHITECTURE.md — Wylder Trails

## Visão Geral

Wylder Trails é um aplicativo mobile para cadastro, descoberta e navegação de trilhas ao redor do mundo. A arquitetura segue o padrão **Client–Server** com suporte a modo offline no cliente.

---

## Camadas da Aplicação

```
┌─────────────────────────────────────────────────────┐
│                  Mobile App (Expo)                  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Screens  │  │  Components  │  │   Hooks     │  │
│  └────────────┘  └──────────────┘  └─────────────┘  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Context   │  │  Services    │  │  Offline DB │  │
│  │  (State)   │  │  (API calls) │  │  (SQLite)   │  │
│  └────────────┘  └──────────────┘  └─────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────────────┐
│              Backend API (Node.js + Express)        │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Routes   │  │  Controllers │  │  Middleware │  │
│  └────────────┘  └──────────────┘  └─────────────┘  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Services  │  │   Models     │  │  Validators │  │
│  └────────────┘  └──────────────┘  └─────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
┌────────▼────────┐         ┌──────────▼──────────┐
│   PostgreSQL    │         │   Firebase           │
│   (Dados)       │         │   Auth + Storage     │
└─────────────────┘         └─────────────────────┘
                        │
              ┌──────────▼──────────┐
              │   Mapbox API        │
              │   (Mapas + Offline) │
              └─────────────────────┘
```

---

## Módulos Principais

### Mobile (Expo + React Native)

| Módulo | Responsabilidade |
|--------|-----------------|
| `screens/` | Telas da aplicação (Feed, Mapa, Cadastro, Perfil, Avaliação) |
| `components/` | Componentes reutilizáveis (TrailCard, RatingStars, FilterBar) |
| `hooks/` | Custom hooks (useTrails, useLocation, useOffline) |
| `context/` | Estado global (AuthContext, TrailsContext) |
| `services/` | Chamadas à API e Firebase |
| `db/` | Banco local SQLite para modo offline |
| `navigation/` | React Navigation (bottom tabs + stack) |

### Backend (Node.js + Express)

| Módulo | Responsabilidade |
|--------|-----------------|
| `routes/` | Definição de endpoints REST |
| `controllers/` | Lógica de cada rota |
| `models/` | Modelos de dados (Sequelize ORM) |
| `services/` | Regras de negócio e integrações |
| `middleware/` | Auth JWT, upload de arquivos, validação |
| `migrations/` | Migrações do banco de dados |

---

## Fluxo de Dados

```
Usuário → Tela → Context/Hook → Service → API REST → Controller → Model → PostgreSQL
                                        ↘ Firebase Storage (fotos)
                                        ↘ Mapbox (rotas GPS)
```

## Modo Offline

```
Usuário (sem rede) → SQLite local → Sincroniza quando volta a conexão
                  ↘ Tiles Mapbox baixados previamente
```

---

## Segurança

- Autenticação via **Firebase Auth** (JWT tokens)
- Backend valida token em toda rota protegida
- Upload de fotos direto para **Firebase Storage** (sem passar pelo backend)
- Variáveis sensíveis em `.env` (nunca commitadas)

---

## Deploy

| Ambiente | Serviço |
|----------|---------|
| Backend API | Railway |
| Banco de dados | Railway PostgreSQL |
| App Mobile | Expo EAS (APK + Web) |
| Arquivos estáticos | Firebase Storage |
