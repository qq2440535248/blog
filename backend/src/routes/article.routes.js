const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const articleController = require('../controllers/article.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/', articleController.list);
router.get('/:id', articleController.detail);
router.post('/', articleController.create);
router.put('/:id', articleController.update);
router.delete('/:id', articleController.remove);

module.exports = router;
