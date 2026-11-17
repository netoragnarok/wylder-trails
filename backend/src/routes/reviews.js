const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createReview, getTrailReviews, updateReview } = require('../controllers/reviewsController');

router.get('/:trailId', getTrailReviews);
router.post('/:trailId', authenticate, createReview);
router.put('/:reviewId', authenticate, updateReview);

module.exports = router;
