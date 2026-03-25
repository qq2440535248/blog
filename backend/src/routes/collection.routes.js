const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const optionalAuthMiddleware = require('../middlewares/optional-auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateArticleIdParam } = require('../validators/like.validator');
const collectionController = require('../controllers/collection.controller');

const router = express.Router();

router.post('/articles/:id/collect', authMiddleware, validate(validateArticleIdParam), collectionController.collect);
router.delete('/articles/:id/collect', authMiddleware, validate(validateArticleIdParam), collectionController.uncollect);
router.get('/articles/:id/is-collected', optionalAuthMiddleware, validate(validateArticleIdParam), collectionController.isCollected);

module.exports = router;
