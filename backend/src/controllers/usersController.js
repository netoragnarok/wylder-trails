const db = require('../db');

// GET /api/users/me
async function getMe(req, res) {
  res.json(req.user);
}

// GET /api/users/:id
async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, name, email, avatar_url, level, trails_count, followers_count, following_count, bio, location, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id/trails
async function getUserTrails(req, res, next) {
  try {
    const { id } = req.params;
    const isOwner = req.user && req.user.id === id;

    const result = await db.query(
      `SELECT id, name, difficulty, distance_km, rating_avg, photos,
              location_city, location_state, is_public, created_at
       FROM trails
       WHERE author_id = $1 ${isOwner ? '' : 'AND is_public = TRUE'}
       ORDER BY created_at DESC`,
      [id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/me
async function updateMe(req, res, next) {
  try {
    const { name, bio, location } = req.body;
    const result = await db.query(
      'UPDATE users SET name=$1, bio=$2, location=$3 WHERE id=$4 RETURNING *',
      [name || req.user.name, bio || null, location || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/users/:id/follow
async function followUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Você não pode seguir a si mesmo' });

    await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    );
    await db.query('UPDATE users SET followers_count = followers_count + 1 WHERE id = $1', [id]);
    await db.query('UPDATE users SET following_count = following_count + 1 WHERE id = $1', [req.user.id]);

    res.json({ message: 'Seguindo com sucesso' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id/follow
async function unfollowUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, id]
    );
    if (result.rowCount > 0) {
      await db.query('UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = $1', [id]);
      await db.query('UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = $1', [req.user.id]);
    }
    res.json({ message: 'Deixou de seguir' });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id/offline-trails
async function getOfflineTrails(req, res, next) {
  try {
    const result = await db.query(
      `SELECT t.*, u.name as author_name
       FROM offline_saves os
       JOIN trails t ON os.trail_id = t.id
       LEFT JOIN users u ON t.author_id = u.id
       WHERE os.user_id = $1
       ORDER BY os.saved_at DESC`,
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, getUser, getUserTrails, updateMe, followUser, unfollowUser, getOfflineTrails };
