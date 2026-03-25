const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const likeController = require('../controllers/like.controller');

const router = express.Router();

router.post('/articles/:id/like', authMiddleware, likeController.like);
router.delete('/articles/:id/like', authMiddleware, likeController.unlike);
router.get('/articles/:id/is-liked', authMiddleware, likeController.isLiked);

module.exports = router;
