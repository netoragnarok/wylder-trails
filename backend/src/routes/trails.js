const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listTrails, getTrail, createTrail, updateTrail, deleteTrail, saveOffline, searchTrails
} = require('../controllers/trailsController');

router.get('/search', searchTrails);
router.get('/', listTrails);
router.get('/:id', getTrail);
router.post('/', authenticate, createTrail);
router.put('/:id', authenticate, updateTrail);
router.delete('/:id', authenticate, deleteTrail);
router.post('/:id/offline', authenticate, saveOffline);

module.exports = router;
