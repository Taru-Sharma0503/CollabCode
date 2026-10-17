const crypto = require('crypto');

function requestIdMiddleware(req, res, next) {
  req.id = req.headers['x-request-id'] || `req_${crypto.randomBytes(8).toString('hex')}`;
  res.setHeader('x-request-id', req.id);
  next();
}

module.exports = requestIdMiddleware;
