const { fail, ERROR_CODES } = require('../utils/http');

function validate(schema) {
    return (req, res, next) => {
        const result = schema(req);
        if (result === true) {
            return next();
        }

        return fail(res, result || 'Invalid request data', 400, ERROR_CODES.BAD_REQUEST);
    };
}

module.exports = validate;
