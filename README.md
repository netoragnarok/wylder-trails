# 🌲 Wylder Trails

Aplicativo mobile para cadastro, descoberta e navegação de trilhas ao redor do mundo.

## Sobre o Projeto

Wylder Trails é uma plataforma colaborativa onde trilheiros podem:

- Cadastrar trilhas com GPS em tempo real
- Avaliar e dar feedback em trilhas
- Fazer upload de fotos
- Visualizar rotas, waypoints e pontos de perigo no mapa
- Navegar trilhas offline (sem internet)
- Descobrir trilhas próximas com filtros avançados

## Tecnologias

| Camada | Stack |
|--------|-------|
| Mobile | Expo + React Native + TypeScript |
| Mapas | Mapbox GL (rotas, offline, terreno) |
| Backend | Node.js + Express |
| Banco | PostgreSQL |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Deploy | Railway (API) + Expo EAS (App) |

## Estrutura do Projeto

```
wylder-trails/
├── ARCHITECTURE.md   # Arquitetura da solução
├── STACK.md          # Tecnologias e versões
├── BUSINESS_RULES.md # Regras de negócio
├── SPEC.md           # Spec da feature principal
├── backend/          # API Node.js + Express
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       └── db/
├── mobile/           # App Expo + React Native
│   ├── app/          # Telas (Expo Router)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── services/
│       ├── hooks/
│       └── constants/
└── docs/             # Apresentação do produto
```

## Como Executar

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16+
- Conta Firebase (Auth + Storage)
- Token Mapbox

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha as variáveis
node src/db/migrate.js # cria as tabelas
node src/db/seed.js    # dados iniciais (opcional)
npm run dev
```

### Mobile

```bash
cd mobile
npm install
cp .env.example .env   # preencha as variáveis
npm start              # abre o Expo
```

Leia o QR code com o aplicativo **Expo Go** no celular.

## Como Obter as Chaves de API

### Mapbox

1. Acesse [mapbox.com](https://account.mapbox.com) e crie uma conta
2. Vá em **Tokens** e crie um token público (`pk.xxx`) para o app
3. Crie um token secreto (`sk.xxx`) para o build do EAS
4. Cole no `.env` do mobile: `EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxx`

### Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto
3. Em **Authentication**, ative Email/Password
4. Em **Storage**, crie um bucket
5. Em **Configurações do Projeto > Geral**, copie as credenciais do web app para `.env` do mobile
6. Em **Configurações > Contas de Serviço**, gere uma chave privada JSON para o backend

### Railway (Deploy)

1. Acesse [railway.app](https://railway.app)
2. Crie um novo projeto e adicione um plugin **PostgreSQL**
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente iguais ao `.env.example` do backend
5. Railway detecta automaticamente o `railway.json` e faz o deploy

## Deploy

### Backend → Railway
```bash
# Instale o CLI do Railway
npm install -g @railway/cli
railway login
railway up
```

### App → Expo EAS
```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Arquivos de Especificação

Este projeto segue o padrão **Spec Driven Development**:

- `ARCHITECTURE.md` — Camadas da solução
- `STACK.md` — Linguagens e versões
- `BUSINESS_RULES.md` — Regras do domínio
- `SPEC.md` — Spec da feature principal (cadastro + mapa)

## Disciplina

Avaliação da disciplina **Desenvolvimento de Software Apoiado com IA**  
Ferramenta: GitHub Copilot + Kiro IDE  
Padrão: Spec Driven Development
