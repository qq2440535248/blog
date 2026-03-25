const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const optionalAuthMiddleware = require('../middlewares/optional-auth.middleware');
const articleController = require('../controllers/article.controller');
const validate = require('../middlewares/validate.middleware');
const { validateArticleCreate, validateArticleUpdate, validateIdParam } = require('../validators/article.validator');

const router = express.Router();

router.get('/public', articleController.listPublic);
router.get('/moderation', authMiddleware, adminMiddleware, articleController.listModeration);
router.get('/:id/moderation-logs', authMiddleware, adminMiddleware, validate(validateIdParam), articleController.listModerationLogs);
router.get('/:id', optionalAuthMiddleware, validate(validateIdParam), articleController.detail);
router.get('/', authMiddleware, articleController.list);
router.patch('/:id/takedown', authMiddleware, adminMiddleware, validate(validateIdParam), articleController.adminTakedown);
router.patch('/:id/restore', authMiddleware, adminMiddleware, validate(validateIdParam), articleController.adminRestore);
router.post('/', authMiddleware, validate(validateArticleCreate), articleController.create);
router.put('/:id', authMiddleware, validate(validateIdParam), validate(validateArticleUpdate), articleController.update);
router.delete('/:id', authMiddleware, validate(validateIdParam), articleController.remove);

module.exports = router;
