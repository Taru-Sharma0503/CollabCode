const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Session = require('../../models/Session');
const { AppError } = require('../../middleware/errorHandler');
const { ERROR_CODES } = require('../../../../shared/contracts/constants');

class UsersService {
  async updateProfile(userId, { name, avatarUrl }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        throw new AppError('Name must be at least 2 characters long.', 422, ERROR_CODES.VALIDATION_ERROR);
      }
      user.name = name.trim();
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    await user.save();
    return user.toSafeObject();
  }

  async updatePassword(userId, { currentPassword, newPassword, confirmPassword }) {
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 422, ERROR_CODES.VALIDATION_ERROR);
    }
    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match.', 422, ERROR_CODES.VALIDATION_ERROR, [
        { field: 'confirmPassword', message: 'Passwords must match.' }
      ]);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {
      message: 'Password updated successfully.'
    };
  }

  async getSessions(userId) {
    const sessions = await Session.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActiveAt: -1 });

    return sessions.map((s) => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt
    }));
  }

  async revokeSession(userId, sessionId) {
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new AppError('Session not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    session.isRevoked = true;
    await session.save();
    return true;
  }
}

module.exports = new UsersService();
