const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const draftController = require('../controllers/draft.controller');
const validate = require('../middlewares/validate.middleware');
const { validateDraftCreateOrUpdate, validateIdParam } = require('../validators/draft.validator');

const router = express.Router();

router.use(authMiddleware);
router.get('/', draftController.list);
router.get('/:id', validate(validateIdParam), draftController.detail);
router.post('/', validate(validateDraftCreateOrUpdate), draftController.create);
router.put('/:id', validate(validateIdParam), validate(validateDraftCreateOrUpdate), draftController.update);
router.delete('/:id', validate(validateIdParam), draftController.remove);
router.post('/:id/publish', validate(validateIdParam), draftController.publish);

module.exports = router;
