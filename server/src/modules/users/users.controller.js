const usersService = require('./users.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');

class UsersController {
  async updateProfile(req, res, next) {
    try {
      const { name, avatarUrl } = req.body;
      const user = await usersService.updateProfile(req.user.id, { name, avatarUrl });
      res.status(200).json(createSuccessResponse({ user }));
    } catch (err) {
      next(err);
    }
  }

  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await usersService.updatePassword(req.user.id, {
        currentPassword,
        newPassword,
        confirmPassword
      });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async getSessions(req, res, next) {
    try {
      const sessions = await usersService.getSessions(req.user.id);
      res.status(200).json(createSuccessResponse({ sessions }));
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      await usersService.revokeSession(req.user.id, sessionId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UsersController();
