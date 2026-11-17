const db = require('../db');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const trailSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(2000).allow('', null),
  location_city: Joi.string().max(100).allow('', null),
  location_state: Joi.string().max(100).allow('', null),
  location_country: Joi.string().max(100).default('Brasil'),
  difficulty: Joi.string().valid('fácil', 'moderada', 'difícil').required(),
  distance_km: Joi.number().positive().required(),
  terrain_type: Joi.string().valid('íngreme', 'plano', 'mesclado').allow(null),
  estimated_duration_minutes: Joi.number().integer().positive().allow(null),
  has_parking: Joi.boolean().default(false),
  is_accessible_by_car: Joi.boolean().default(false),
  is_accessible_by_motorcycle: Joi.boolean().default(false),
  is_accessible_by_bicycle: Joi.boolean().default(false),
  is_accessible_on_foot: Joi.boolean().default(true),
  has_cell_signal: Joi.boolean().default(false),
  has_waterfall: Joi.boolean().default(false),
  has_camping: Joi.boolean().default(false),
  has_river_crossing: Joi.boolean().default(false),
  has_climbing: Joi.boolean().default(false),
  best_seasons: Joi.array().items(Joi.string()).default([]),
  fauna_flora_notes: Joi.string().max(300).allow('', null),
  is_public: Joi.boolean().default(true),
  route: Joi.array().items(Joi.object()).default([]),
  waypoints: Joi.array().items(Joi.object()).default([]),
  danger_points: Joi.array().items(Joi.object()).default([]),
  photos: Joi.array().items(Joi.string()).default([]),
  start_lat: Joi.number().allow(null),
  start_lng: Joi.number().allow(null),
});

// GET /api/trails
async function listTrails(req, res, next) {
  try {
    const {
      lat, lng, difficulty, max_distance_km,
      has_parking, has_waterfall, has_camping,
      country, state, sort = 'recent',
      page = 1, limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['t.is_public = TRUE'];
    const params = [];
    let paramIdx = 1;

    if (difficulty) {
      conditions.push(`t.difficulty = $${paramIdx++}`);
      params.push(difficulty);
    }
    if (max_distance_km) {
      conditions.push(`t.distance_km <= $${paramIdx++}`);
      params.push(parseFloat(max_distance_km));
    }
    if (has_parking === 'true') {
      conditions.push(`t.has_parking = TRUE`);
    }
    if (has_waterfall === 'true') {
      conditions.push(`t.has_waterfall = TRUE`);
    }
    if (has_camping === 'true') {
      conditions.push(`t.has_camping = TRUE`);
    }
    if (country) {
      conditions.push(`t.location_country ILIKE $${paramIdx++}`);
      params.push(`%${country}%`);
    }
    if (state) {
      conditions.push(`t.location_state ILIKE $${paramIdx++}`);
      params.push(`%${state}%`);
    }

    let orderBy = 't.created_at DESC';
    if (sort === 'rating') orderBy = 't.rating_avg DESC, t.rating_count DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM trails t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);

    const result = await db.query(
      `SELECT t.id, t.name, t.difficulty, t.distance_km, t.terrain_type,
              t.location_city, t.location_state, t.location_country,
              t.rating_avg, t.rating_count, t.photos, t.has_parking,
              t.has_waterfall, t.has_camping, t.start_lat, t.start_lng,
              t.estimated_duration_minutes, t.created_at,
              u.name as author_name, u.id as author_id
       FROM trails t
       LEFT JOIN users u ON t.author_id = u.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );

    res.json({
      data: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/trails/:id
async function getTrail(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT t.*, u.name as author_name, u.avatar_url as author_avatar, u.id as author_id
       FROM trails t
       LEFT JOIN users u ON t.author_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    const trail = result.rows[0];

    // Busca últimas 5 avaliações
    const reviews = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.trail_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [id]
    );

    trail.recent_reviews = reviews.rows;

    res.json(trail);
  } catch (err) {
    next(err);
  }
}

// POST /api/trails
async function createTrail(req, res, next) {
  try {
    let body = req.body;

    // Parse de arrays/objetos que podem vir como string no multipart
    ['route', 'waypoints', 'danger_points', 'photos', 'best_seasons'].forEach(field => {
      if (typeof body[field] === 'string') {
        try { body[field] = JSON.parse(body[field]); } catch {}
      }
    });

    // Converte strings 'true'/'false' para booleanos
    const boolFields = ['has_parking','is_accessible_by_car','is_accessible_by_motorcycle',
      'is_accessible_by_bicycle','is_accessible_on_foot','has_cell_signal',
      'has_waterfall','has_camping','has_river_crossing','has_climbing','is_public'];
    boolFields.forEach(f => {
      if (body[f] === 'true') body[f] = true;
      if (body[f] === 'false') body[f] = false;
    });

    const { error, value } = trailSchema.validate(body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Calcula ponto de início da rota
    if (value.route && value.route.length > 0) {
      value.start_lat = value.route[0].lat;
      value.start_lng = value.route[0].lng;
    }

    const result = await db.query(
      `INSERT INTO trails (
        author_id, name, description, location_city, location_state, location_country,
        difficulty, distance_km, terrain_type, estimated_duration_minutes,
        has_parking, is_accessible_by_car, is_accessible_by_motorcycle,
        is_accessible_by_bicycle, is_accessible_on_foot, has_cell_signal,
        has_waterfall, has_camping, has_river_crossing, has_climbing,
        best_seasons, fauna_flora_notes, is_public, route, waypoints,
        danger_points, photos, start_lat, start_lng
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29
      ) RETURNING *`,
      [
        req.user.id, value.name, value.description, value.location_city,
        value.location_state, value.location_country, value.difficulty,
        value.distance_km, value.terrain_type, value.estimated_duration_minutes,
        value.has_parking, value.is_accessible_by_car, value.is_accessible_by_motorcycle,
        value.is_accessible_by_bicycle, value.is_accessible_on_foot, value.has_cell_signal,
        value.has_waterfall, value.has_camping, value.has_river_crossing, value.has_climbing,
        value.best_seasons, value.fauna_flora_notes, value.is_public,
        JSON.stringify(value.route), JSON.stringify(value.waypoints),
        JSON.stringify(value.danger_points), value.photos,
        value.start_lat, value.start_lng
      ]
    );

    // Atualiza contador de trilhas do usuário
    await db.query(
      'UPDATE users SET trails_count = trails_count + 1, level = CASE WHEN trails_count + 1 >= 21 THEN \'veterano\' WHEN trails_count + 1 >= 6 THEN \'explorador\' ELSE \'iniciante\' END WHERE id = $1',
      [req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/trails/:id
async function updateTrail(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT * FROM trails WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }
    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta trilha' });
    }

    const { error, value } = trailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await db.query(
      `UPDATE trails SET
        name=$1, description=$2, location_city=$3, location_state=$4,
        difficulty=$5, distance_km=$6, terrain_type=$7, estimated_duration_minutes=$8,
        has_parking=$9, is_accessible_by_car=$10, is_accessible_by_motorcycle=$11,
        is_accessible_by_bicycle=$12, is_accessible_on_foot=$13, has_cell_signal=$14,
        has_waterfall=$15, has_camping=$16, has_river_crossing=$17, has_climbing=$18,
        best_seasons=$19, fauna_flora_notes=$20, is_public=$21, route=$22,
        waypoints=$23, danger_points=$24, photos=$25, updated_at=NOW()
       WHERE id=$26 RETURNING *`,
      [
        value.name, value.description, value.location_city, value.location_state,
        value.difficulty, value.distance_km, value.terrain_type, value.estimated_duration_minutes,
        value.has_parking, value.is_accessible_by_car, value.is_accessible_by_motorcycle,
        value.is_accessible_by_bicycle, value.is_accessible_on_foot, value.has_cell_signal,
        value.has_waterfall, value.has_camping, value.has_river_crossing, value.has_climbing,
        value.best_seasons, value.fauna_flora_notes, value.is_public,
        JSON.stringify(value.route), JSON.stringify(value.waypoints),
        JSON.stringify(value.danger_points), value.photos, id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/trails/:id
async function deleteTrail(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT author_id FROM trails WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Trilha não encontrada' });
    if (existing.rows[0].author_id !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });

    await db.query('DELETE FROM trails WHERE id = $1', [id]);
    await db.query('UPDATE users SET trails_count = GREATEST(trails_count - 1, 0) WHERE id = $1', [req.user.id]);

    res.json({ message: 'Trilha removida com sucesso' });
  } catch (err) {
    next(err);
  }
}

// POST /api/trails/:id/offline
async function saveOffline(req, res, next) {
  try {
    const { id } = req.params;
    await db.query(
      'INSERT INTO offline_saves (user_id, trail_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    );
    res.json({ message: 'Trilha salva para uso offline' });
  } catch (err) {
    next(err);
  }
}

// GET /api/trails/search
async function searchTrails(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.json({ data: [] });

    const result = await db.query(
      `SELECT t.id, t.name, t.difficulty, t.distance_km, t.location_city,
              t.location_state, t.rating_avg, t.photos, t.start_lat, t.start_lng
       FROM trails t
       WHERE t.is_public = TRUE AND (
         t.name ILIKE $1 OR
         t.location_city ILIKE $1 OR
         t.location_state ILIKE $1 OR
         t.location_country ILIKE $1
       )
       ORDER BY t.rating_avg DESC
       LIMIT 30`,
      [`%${q}%`]
    );

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTrails, getTrail, createTrail, updateTrail, deleteTrail, saveOffline, searchTrails };
