require('dotenv').config();
const db = require('./index');

const migration = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    level VARCHAR(20) DEFAULT 'iniciante',
    trails_count INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    bio VARCHAR(300),
    location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'Brasil',
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
    best_seasons TEXT[] DEFAULT '{}',
    fauna_flora_notes VARCHAR(300),
    is_public BOOLEAN DEFAULT TRUE,
    rating_avg NUMERIC(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    route JSONB DEFAULT '[]',
    waypoints JSONB DEFAULT '[]',
    danger_points JSONB DEFAULT '[]',
    photos TEXT[] DEFAULT '{}',
    start_lat NUMERIC(10,7),
    start_lng NUMERIC(10,7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trail_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS offline_saves (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trail_id UUID REFERENCES trails(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, trail_id)
  );

  CREATE INDEX IF NOT EXISTS idx_trails_difficulty ON trails(difficulty);
  CREATE INDEX IF NOT EXISTS idx_trails_author ON trails(author_id);
  CREATE INDEX IF NOT EXISTS idx_trails_public ON trails(is_public);
  CREATE INDEX IF NOT EXISTS idx_reviews_trail ON reviews(trail_id);
`;

async function migrate() {
  try {
    await db.query(migration);
    console.log('✅ Migrações executadas com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao executar migrações:', err.message);
    process.exit(1);
  }
}

migrate();
