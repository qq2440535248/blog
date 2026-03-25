const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const tagController = require('../controllers/tag.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/', tagController.list);
router.post('/', tagController.create);
router.put('/:id', tagController.update);
router.delete('/:id', tagController.remove);

module.exports = router;
