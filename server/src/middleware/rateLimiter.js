const { AppError } = require('./errorHandler');
const { ERROR_CODES } = require('../../../shared/contracts/constants');

class MemoryRateLimiter {
  constructor(windowMs = 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map();

    // Clean up every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now - record.startTime > this.windowMs) {
          this.hits.delete(key);
        }
      }
    }, 60 * 1000).unref();
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const key = `${ip}:${req.baseUrl || req.path}`;
      const now = Date.now();

      let record = this.hits.get(key);
      if (!record || now - record.startTime > this.windowMs) {
        record = { count: 1, startTime: now };
        this.hits.set(key, record);
      } else {
        record.count++;
      }

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((record.startTime + this.windowMs) / 1000));

      if (record.count > this.maxRequests) {
        return next(
          new AppError(
            'Too many requests. Please slow down and try again later.',
            429,
            ERROR_CODES.RATE_LIMIT_EXCEEDED
          )
        );
      }

      next();
    };
  }
}

function createRateLimiter(options) {
  const limiter = new MemoryRateLimiter(options?.windowMs, options?.maxRequests);
  return limiter.middleware();
}

module.exports = {
  createRateLimiter
};
