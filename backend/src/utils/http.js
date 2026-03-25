const ERROR_CODES = require('../constants/error-codes');

class AppError extends Error {
  constructor(message, status = 500, code = ERROR_CODES.INTERNAL_SERVER_ERROR) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function success(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({
    code: 0,
    message,
    data,
  });
}

function fail(res, message, status = 400, code = ERROR_CODES.BAD_REQUEST, details = null) {
  return res.status(status).json({
    code,
    message,
    details,
  });
}

module.exports = {
  AppError,
  success,
  fail,
  ERROR_CODES,
};
