const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const optionalAuthMiddleware = require('../middlewares/optional-auth.middleware');
const validate = require('../middlewares/validate.middleware');
const commentController = require('../controllers/comment.controller');
const {
    validateArticleIdParam,
    validateCommentIdParam,
    validateCommentCreate,
} = require('../validators/comment.validator');

const router = express.Router();

router.get('/articles/:id/comments', optionalAuthMiddleware, validate(validateArticleIdParam), commentController.listByArticle);
router.post('/articles/:id/comments', authMiddleware, validate(validateArticleIdParam), validate(validateCommentCreate), commentController.create);

router.post('/comments/:id/like', authMiddleware, validate(validateCommentIdParam), commentController.like);
router.delete('/comments/:id/like', authMiddleware, validate(validateCommentIdParam), commentController.unlike);

module.exports = router;
