const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateUpdateProfile, validateChangePassword } = require('../validators/user.validator');

const router = express.Router();

router.get('/me', authMiddleware, userController.getMe);
router.put('/me', authMiddleware, validate(validateUpdateProfile), userController.updateMe);
router.put('/me/password', authMiddleware, validate(validateChangePassword), userController.changePassword);

module.exports = router;
