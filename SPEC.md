# SPEC.md — Feature: Cadastro e Visualização de Trilhas

## Contexto

Esta spec descreve a primeira feature do Wylder Trails: o fluxo completo de **cadastrar uma nova trilha** e **visualizá-la no feed e no mapa**.

Arquivos de referência:
- #[[file:ARCHITECTURE.md]]
- #[[file:STACK.md]]
- #[[file:BUSINESS_RULES.md]]

---

## Feature: Trail Registration & Map View

### Objetivo
Permitir que um usuário autenticado registre uma trilha com percurso GPS, atributos e fotos, e que qualquer usuário possa visualizá-la no feed e no mapa interativo.

---

## Endpoints da API

### POST /api/trails
Cadastra uma nova trilha.

**Auth**: Bearer token (Firebase JWT) obrigatório.

**Body (multipart/form-data)**:
```json
{
  "name": "Trilha do Pico da Neblina",
  "description": "Trilha desafiadora com vista incrível.",
  "location_city": "São Gabriel da Cachoeira",
  "location_state": "AM",
  "location_country": "Brasil",
  "difficulty": "difícil",
  "distance_km": 21.5,
  "terrain_type": "íngreme",
  "estimated_duration_minutes": 480,
  "has_parking": false,
  "is_accessible_by_car": false,
  "is_accessible_by_motorcycle": false,
  "is_accessible_by_bicycle": false,
  "is_accessible_on_foot": true,
  "has_cell_signal": false,
  "has_waterfall": true,
  "has_camping": true,
  "has_river_crossing": true,
  "has_climbing": true,
  "best_seasons": ["verão", "outono"],
  "fauna_flora_notes": "Araras-azuis e orquídeas ao longo do percurso.",
  "is_public": true,
  "route": [
    { "lat": -0.1234, "lng": -66.9876, "elevation": 320 },
    { "lat": -0.1300, "lng": -66.9900, "elevation": 350 }
  ],
  "waypoints": [
    { "lat": -0.1234, "lng": -66.9876, "type": "entrada", "label": "Entrada principal" },
    { "lat": -0.1300, "lng": -66.9900, "type": "cachoeira", "label": "Cachoeira do Vale" }
  ],
  "danger_points": [
    { "lat": -0.1270, "lng": -66.9888, "type": "animais peçonhentos", "description": "Área com cobras jararaca" }
  ],
  "photos": ["<file>", "<file>"]
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "name": "Trilha do Pico da Neblina",
  "author": { "id": "uid", "name": "Marina Castro" },
  "rating_avg": null,
  "photos": ["https://storage.firebase.com/..."],
  "created_at": "2026-11-17T20:00:00Z"
}
```

---

### GET /api/trails
Lista trilhas públicas com suporte a filtros.

**Query params**:
- `lat`, `lng` — coordenadas do usuário (para ordenar por proximidade)
- `difficulty` — `fácil` | `moderada` | `difícil`
- `max_distance_km` — número
- `has_parking` — `true` | `false`
- `has_waterfall` — `true` | `false`
- `has_camping` — `true` | `false`
- `country` — string
- `state` — string
- `sort` — `proximity` | `rating` | `recent` (default: `proximity`)
- `page`, `limit` — paginação (default: page=1, limit=20)

**Response 200**:
```json
{
  "data": [ { "id": "...", "name": "...", "difficulty": "...", "rating_avg": 4.5, "distance_km": 21.5, "photos": ["..."], "location_city": "...", "location_state": "..." } ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/trails/:id
Retorna detalhes completos de uma trilha.

**Response 200**: Objeto completo da trilha com route, waypoints, danger_points, reviews (últimos 5) e autor.

---

## Telas do Mobile

### 1. Feed Screen (`/screens/FeedScreen.tsx`)
- Exibe cards de trilhas próximas ao usuário.
- Barra de filtros rápidos: Todas / Fácil / Moderada / Difícil / Com estacionamento.
- Busca por nome.
- Cada card mostra: foto principal, nome, dificuldade (badge colorido), distância, nota média (estrelas), cidade/estado.
- Pull-to-refresh.

### 2. Create Trail Screen (`/screens/CreateTrailScreen.tsx`)
- Formulário com todos os campos da BR-01 a BR-11 e BR-30/31.
- Gravação GPS em tempo real com cronômetro e distância acumulada.
- Upload de até 20 fotos (câmera ou galeria).
- Seletor de waypoints no mapa (toque para adicionar).
- Seletor de pontos de perigo com tipo.
- Botão "Publicar trilha" (valida todos os campos obrigatórios antes).

### 3. Trail Detail Screen (`/screens/TrailDetailScreen.tsx`)
- Mapa com a rota desenhada (linha azul), waypoints e pontos de perigo.
- Badges de atributos (estacionamento, cachoeira, etc.).
- Seção de avaliações com nota média e estrelas.
- Botão "Salvar offline" (download da rota e tiles).
- Botão "Adicionar avaliação".

### 4. Map Screen (`/screens/MapScreen.tsx`)
- Mapa Mapbox em tela cheia.
- Marcadores de trilhas próximas.
- Toque no marcador abre preview da trilha.
- Botão de camadas (satélite / terreno / padrão).
- Indicador de tiles offline disponíveis.

---

## Modelo de Dados (PostgreSQL)

```sql
-- Tabela de usuários (espelha Firebase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  level VARCHAR(20) DEFAULT 'iniciante',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de trilhas
CREATE TABLE trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(100),
  location_country VARCHAR(100),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('fácil','moderada','difícil')),
  distance_km NUMERIC(8,2) NOT NULL,
  terrain_type VARCHAR(20) CHECK (terrain_type IN ('íngreme','plano','mesclado')),
  estimated_duration_minutes INT,
  has_parking BOOLEAN DEFAULT FALSE,
  is_accessible_by_car BOOLEAN DEFAULT FALSE,
  is_accessible_by_motorcycle BOOLEAN DEFAULT FALSE,
  is_accessible_by_bicycle BOOLEAN DEFAULT FALSE,
  is_accessible_on_foot BOOLEAN DEFAULT TRUE,
  has_cell_signal BOOLEAN DEFAULT FALSE,
  has_waterfall BOOLEAN DEFAULT FALSE,
  has_camping BOOLEAN DEFAULT FALSE,
  has_river_crossing BOOLEAN DEFAULT FALSE,
  has_climbing BOOLEAN DEFAULT FALSE,
  best_seasons TEXT[],
  fauna_flora_notes VARCHAR(300),
  is_public BOOLEAN DEFAULT TRUE,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  route JSONB,
  waypoints JSONB,
  danger_points JSONB,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trail_id, user_id)
);

-- Tabela de seguidores
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id),
  following_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Tabela de trilhas salvas offline
CREATE TABLE offline_saves (
  user_id UUID REFERENCES users(id),
  trail_id UUID REFERENCES trails(id),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, trail_id)
);
```

---

## Critérios de Aceite

| ID | Critério |
|----|----------|
| AC-01 | Usuário autenticado pode cadastrar uma trilha com todos os campos obrigatórios |
| AC-02 | O percurso GPS é gravado em tempo real durante a trilha |
| AC-03 | As fotos são enviadas ao Firebase Storage e URLs salvas no banco |
| AC-04 | A trilha aparece no feed após publicação |
| AC-05 | O mapa exibe a rota, waypoints e pontos de perigo corretamente |
| AC-06 | A busca e filtros retornam resultados corretos |
| AC-07 | O modo offline permite navegar a trilha sem internet |
| AC-08 | A nota média é atualizada após cada avaliação |
| AC-09 | Usuário não pode avaliar sua própria trilha (BR-19) |
| AC-10 | Pontos de perigo ficam visíveis no mapa para todos os usuários |
