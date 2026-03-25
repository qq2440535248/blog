const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { imageUpload } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateUpdateProfile, validateChangePassword } = require('../validators/user.validator');

const router = express.Router();

router.get('/me', authMiddleware, userController.getMe);
router.put('/me', authMiddleware, validate(validateUpdateProfile), userController.updateMe);
router.put('/me/password', authMiddleware, validate(validateChangePassword), userController.changePassword);
router.post('/me/avatar', authMiddleware, imageUpload.single('avatar'), userController.uploadAvatar);
router.get('/me/likes', authMiddleware, userController.listMyLikes);
router.get('/me/collections', authMiddleware, userController.listMyCollections);

module.exports = router;
