const db = require('../db');
const Joi = require('joi');

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).allow('', null),
});

// POST /api/reviews/:trailId
async function createReview(req, res, next) {
  try {
    const { trailId } = req.params;

    // Verifica se trilha existe
    const trail = await db.query('SELECT * FROM trails WHERE id = $1', [trailId]);
    if (trail.rows.length === 0) return res.status(404).json({ error: 'Trilha não encontrada' });

    // BR-19: não pode avaliar a própria trilha
    if (trail.rows[0].author_id === req.user.id) {
      return res.status(403).json({ error: 'Você não pode avaliar sua própria trilha' });
    }

    const { error, value } = reviewSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await db.query(
      `INSERT INTO reviews (trail_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [trailId, req.user.id, value.rating, value.comment]
    );

    // Recalcula média
    await recalcRating(trailId);

    const review = result.rows[0];
    review.user_name = req.user.name;
    review.user_avatar = req.user.avatar_url;

    res.status(201).json(review);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Você já avaliou esta trilha' });
    }
    next(err);
  }
}

// GET /api/reviews/:trailId
async function getTrailReviews(req, res, next) {
  try {
    const { trailId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.trail_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [trailId, parseInt(limit), offset]
    );

    const count = await db.query('SELECT COUNT(*) FROM reviews WHERE trail_id = $1', [trailId]);

    res.json({
      data: result.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/reviews/:reviewId
async function updateReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const existing = await db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Avaliação não encontrada' });
    if (existing.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });

    const { error, value } = reviewSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await db.query(
      'UPDATE reviews SET rating=$1, comment=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [value.rating, value.comment, reviewId]
    );

    await recalcRating(existing.rows[0].trail_id);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function recalcRating(trailId) {
  await db.query(
    `UPDATE trails SET
       rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE trail_id = $1),
       rating_count = (SELECT COUNT(*) FROM reviews WHERE trail_id = $1)
     WHERE id = $1`,
    [trailId]
  );
}

module.exports = { createReview, getTrailReviews, updateReview };
