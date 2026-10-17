const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString(),
      email: user.email,
      name: user.name
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_TTL
    }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenCookieOptions
};
