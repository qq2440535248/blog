const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');
const validate = require('../middlewares/validate.middleware');
const { validateNameBody, validateIdParam } = require('../validators/taxonomy.validator');

const router = express.Router();

router.use(authMiddleware);
router.get('/', categoryController.list);
router.post('/', validate(validateNameBody), categoryController.create);
router.put('/:id', validate(validateIdParam), validate(validateNameBody), categoryController.update);
router.delete('/:id', validate(validateIdParam), categoryController.remove);

module.exports = router;
