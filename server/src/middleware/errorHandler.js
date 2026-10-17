const { ERROR_CODES } = require('../../../shared/contracts/constants');

class AppError extends Error {
  constructor(message, statusCode = 400, code = ERROR_CODES.VALIDATION_ERROR, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const code = err.code || (statusCode === 404 ? ERROR_CODES.NOT_FOUND :
               statusCode === 401 ? ERROR_CODES.UNAUTHENTICATED :
               statusCode === 403 ? ERROR_CODES.UNAUTHORIZED :
               statusCode === 409 ? ERROR_CODES.CONFLICT :
               statusCode === 422 ? ERROR_CODES.VALIDATION_ERROR :
               ERROR_CODES.INTERNAL_SERVER_ERROR);

  const message = err.message || 'An unexpected internal error occurred.';
  const details = err.details || [];
  const requestId = req.id || `req_${Date.now()}`;

  if (statusCode >= 500) {
    console.error(`[Error] [${requestId}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      requestId
    }
  });
}

module.exports = {
  AppError,
  errorHandler
};
