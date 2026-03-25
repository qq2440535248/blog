const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const articleController = require('../controllers/article.controller');
const validate = require('../middlewares/validate.middleware');
const { validateArticleCreate, validateArticleUpdate, validateIdParam } = require('../validators/article.validator');

const router = express.Router();

router.use(authMiddleware);
router.get('/', articleController.list);
router.get('/:id', validate(validateIdParam), articleController.detail);
router.post('/', validate(validateArticleCreate), articleController.create);
router.put('/:id', validate(validateIdParam), validate(validateArticleUpdate), articleController.update);
router.delete('/:id', validate(validateIdParam), articleController.remove);

module.exports = router;
