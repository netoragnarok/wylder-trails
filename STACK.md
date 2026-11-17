# STACK.md — Wylder Trails

## Mobile

| Tecnologia | Versão | Função |
|------------|--------|--------|
| React Native | 0.74.x | Framework mobile |
| Expo SDK | 51.x | Toolchain e APIs nativas |
| Expo Router | 3.x | Navegação file-based |
| React Navigation | 6.x | Bottom tabs e Stack |
| @rnmapbox/maps | 10.x | Mapas, rotas e offline (Mapbox) |
| expo-location | 17.x | GPS e geolocalização |
| expo-image-picker | 15.x | Seleção e captura de fotos |
| expo-sqlite | 13.x | Banco local para modo offline |
| expo-file-system | 17.x | Armazenamento de tiles offline |
| axios | 1.6.x | Chamadas HTTP à API |
| react-hook-form | 7.x | Formulários e validação |
| @react-native-async-storage | 1.23.x | Persistência de sessão |
| firebase | 10.x | Auth e Storage |

## Backend

| Tecnologia | Versão | Função |
|------------|--------|--------|
| Node.js | 20.x LTS | Runtime |
| Express | 4.x | Framework HTTP |
| Sequelize | 6.x | ORM para PostgreSQL |
| PostgreSQL | 16.x | Banco de dados principal |
| firebase-admin | 12.x | Verificação de tokens |
| multer | 1.4.x | Upload de arquivos |
| joi | 17.x | Validação de dados |
| cors | 2.x | Cross-Origin Resource Sharing |
| helmet | 7.x | Segurança HTTP headers |
| dotenv | 16.x | Variáveis de ambiente |
| pg | 8.x | Driver PostgreSQL |

## Infraestrutura

| Serviço | Uso |
|---------|-----|
| Mapbox GL | Mapas vetoriais, rotas, tiles offline |
| Firebase Authentication | Login com email/senha e Google |
| Firebase Storage | Armazenamento de fotos das trilhas |
| Railway | Hosting backend + PostgreSQL |
| Expo EAS Build | Geração de APK e distribuição |
| GitHub | Controle de versão e CI/CD |

## Versões de Desenvolvimento

| Ferramenta | Versão |
|------------|--------|
| Node.js | 20.x LTS |
| npm | 10.x |
| Expo CLI | 0.18.x |
| Git | 2.x |

## Configuração de Ambiente

Arquivo `.env` necessário no backend:

```env
DATABASE_URL=postgresql://user:password@host:5432/wylder_trails
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
MAPBOX_SECRET_TOKEN=
PORT=3000
NODE_ENV=development
```

Arquivo `.env` necessário no mobile:

```env
EXPO_PUBLIC_API_URL=https://api.wylder-trails.railway.app
EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```
