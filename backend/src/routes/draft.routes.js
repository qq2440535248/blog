const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const draftController = require('../controllers/draft.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/', draftController.list);
router.get('/:id', draftController.detail);
router.post('/', draftController.create);
router.put('/:id', draftController.update);
router.delete('/:id', draftController.remove);
router.post('/:id/publish', draftController.publish);

module.exports = router;
