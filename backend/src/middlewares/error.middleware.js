const { ERROR_CODES } = require('../utils/http');

function errorMiddleware(err, _req, res, _next) {
    // eslint-disable-next-line no-console
    console.error(err);

    return res.status(err.status || 500).json({
        code: err.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: err.message || 'Internal Server Error',
        details: err.details || null,
    });
}

module.exports = errorMiddleware;
