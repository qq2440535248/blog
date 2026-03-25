const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const tagController = require('../controllers/tag.controller');
const validate = require('../middlewares/validate.middleware');
const { validateNameBody, validateIdParam } = require('../validators/taxonomy.validator');

const router = express.Router();

router.use(authMiddleware);
router.get('/', tagController.list);
router.post('/', validate(validateNameBody), tagController.create);
router.put('/:id', validate(validateIdParam), validate(validateNameBody), tagController.update);
router.delete('/:id', validate(validateIdParam), tagController.remove);

module.exports = router;
