const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const likeController = require('../controllers/like.controller');

const router = express.Router();

router.use(authMiddleware);
router.post('/articles/:id/like', likeController.like);
router.delete('/articles/:id/like', likeController.unlike);
router.get('/articles/:id/is-liked', likeController.isLiked);

module.exports = router;
