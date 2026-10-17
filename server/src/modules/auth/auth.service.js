const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/User');
const Session = require('../../models/Session');
const env = require('../../config/env');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../../utils/token');
const { AppError } = require('../../middleware/errorHandler');
const { ERROR_CODES } = require('../../../../shared/contracts/constants');

class AuthService {
  async register({ name, email, password, confirmPassword, deviceInfo = 'Web Browser', ipAddress = '' }) {
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match.', 422, ERROR_CODES.VALIDATION_ERROR, [
        { field: 'confirmPassword', message: 'Passwords must match.' }
      ]);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, ERROR_CODES.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      expiresAt
    });

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    };
  }

  async login({ email, password, deviceInfo = 'Web Browser', ipAddress = '' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHENTICATED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHENTICATED);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      expiresAt
    });

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    };
  }

  async refresh(rawRefreshToken, deviceInfo = 'Web Browser', ipAddress = '') {
    if (!rawRefreshToken) {
      throw new AppError('Refresh token required.', 401, ERROR_CODES.UNAUTHENTICATED);
    }

    const hashed = hashToken(rawRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: hashed });

    if (!session) {
      throw new AppError('Invalid or expired refresh session.', 401, ERROR_CODES.UNAUTHENTICATED);
    }

    if (session.isRevoked || session.expiresAt < new Date()) {
      // Possible token reuse attack - revoke all user sessions
      await Session.updateMany({ userId: session.userId }, { isRevoked: true });
      throw new AppError('Session expired or revoked.', 401, ERROR_CODES.UNAUTHENTICATED);
    }

    const user = await User.findById(session.userId);
    if (!user) {
      throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken();
    session.refreshTokenHash = hashToken(newRefreshToken);
    session.lastActiveAt = new Date();
    session.deviceInfo = deviceInfo || session.deviceInfo;
    session.ipAddress = ipAddress || session.ipAddress;
    await session.save();

    const newAccessToken = generateAccessToken(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(rawRefreshToken) {
    if (rawRefreshToken) {
      const hashed = hashToken(rawRefreshToken);
      await Session.updateOne({ refreshTokenHash: hashed }, { isRevoked: true });
    }
    return true;
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    return user.toSafeObject();
  }

  async forgotPassword(email) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.resetPasswordTokenHash = resetTokenHash;
      user.resetPasswordExpiresAt = expiresAt;
      await user.save();

      // In production, an email would be sent with `${env.PASSWORD_RESET_BASE_URL}/${resetToken}`
      console.log(`[AuthService] Password reset token for ${normalizedEmail}: ${resetToken}`);
    }

    return {
      message: 'If the account exists, reset instructions will be sent.'
    };
  }

  async resetPassword({ token, password, confirmPassword }) {
    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match.', 422, ERROR_CODES.VALIDATION_ERROR, [
        { field: 'confirmPassword', message: 'Passwords must match.' }
      ]);
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    // Revoke all existing sessions for security
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    return {
      message: 'Password updated successfully.'
    };
  }
}

module.exports = new AuthService();
