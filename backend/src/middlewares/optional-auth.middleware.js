const { verifyAccessToken } = require('../utils/jwt');
const { fail, ERROR_CODES } = require('../utils/http');

function optionalAuthMiddleware(req, res, next) {
    req.auth = null;

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (!token) {
        return next();
    }

    try {
        const payload = verifyAccessToken(token);

        if (payload.type !== 'access') {
            return fail(res, 'Token type is invalid', 401, ERROR_CODES.UNAUTHORIZED);
        }

        const userId = Number(payload.sub);
        if (!Number.isInteger(userId) || userId <= 0) {
            return fail(res, 'Token subject is invalid', 401, ERROR_CODES.UNAUTHORIZED);
        }

        req.auth = { userId };
        return next();
    } catch (_err) {
        return fail(res, 'Token invalid or expired', 401, ERROR_CODES.UNAUTHORIZED);
    }
}

module.exports = optionalAuthMiddleware;
