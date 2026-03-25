const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const {
    validateRegister,
    validateLogin,
    validateRefresh,
    validateLogout,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(validateRegister), authController.register);
router.post('/login', validate(validateLogin), authController.login);
router.post('/refresh', validate(validateRefresh), authController.refresh);
router.post('/logout', validate(validateLogout), authController.logout);

module.exports = router;
