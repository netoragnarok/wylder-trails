const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMe, getUser, getUserTrails, updateMe, followUser, unfollowUser, getOfflineTrails
} = require('../controllers/usersController');

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.get('/me/offline-trails', authenticate, getOfflineTrails);
router.get('/:id', getUser);
router.get('/:id/trails', getUser, getUserTrails);
router.post('/:id/follow', authenticate, followUser);
router.delete('/:id/follow', authenticate, unfollowUser);

module.exports = router;
