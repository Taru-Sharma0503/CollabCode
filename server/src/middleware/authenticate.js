const { verifyAccessToken } = require('../utils/token');
const { AppError } = require('./errorHandler');
const { ERROR_CODES } = require('../../../shared/contracts/constants');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401, ERROR_CODES.UNAUTHENTICATED));
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload || !payload.id) {
    return next(new AppError('Invalid or expired access token.', 401, ERROR_CODES.UNAUTHENTICATED));
  }

  req.user = {
    id: payload.id,
    email: payload.email,
    name: payload.name
  };

  next();
}

module.exports = authenticate;
