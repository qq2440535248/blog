const { User } = require('../models');
const { fail, ERROR_CODES } = require('../utils/http');
const { isAdminUser } = require('../utils/role');

async function adminMiddleware(req, res, next) {
    try {
        const user = await User.findByPk(req.auth.userId);
        if (!user) {
            return fail(res, 'User not found', 404, ERROR_CODES.NOT_FOUND);
        }

        if (!isAdminUser(user)) {
            return fail(res, 'Forbidden', 403, ERROR_CODES.FORBIDDEN);
        }

        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = adminMiddleware;
