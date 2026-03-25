const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const likeController = require('../controllers/like.controller');
const validate = require('../middlewares/validate.middleware');
const { validateArticleIdParam } = require('../validators/like.validator');

const router = express.Router();

router.post('/articles/:id/like', authMiddleware, validate(validateArticleIdParam), likeController.like);
router.delete('/articles/:id/like', authMiddleware, validate(validateArticleIdParam), likeController.unlike);
router.get('/articles/:id/is-liked', authMiddleware, validate(validateArticleIdParam), likeController.isLiked);

module.exports = router;
