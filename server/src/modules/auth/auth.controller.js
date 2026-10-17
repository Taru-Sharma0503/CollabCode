const authService = require('./auth.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');
const { getRefreshTokenCookieOptions } = require('../../utils/token');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, confirmPassword } = req.body;
      const deviceInfo = req.headers['user-agent'] || 'Web Browser';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.register({
        name,
        email,
        password,
        confirmPassword,
        deviceInfo,
        ipAddress
      });

      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(201).json(createSuccessResponse({
        user: result.user,
        accessToken: result.accessToken
      }));
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const deviceInfo = req.headers['user-agent'] || 'Web Browser';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.login({
        email,
        password,
        deviceInfo,
        ipAddress
      });

      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json(createSuccessResponse({
        user: result.user,
        accessToken: result.accessToken
      }));
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken;
      const deviceInfo = req.headers['user-agent'] || 'Web Browser';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.refresh(rawRefreshToken, deviceInfo, ipAddress);

      res.cookie('refreshToken', result.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json(createSuccessResponse({
        accessToken: result.accessToken
      }));
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken;
      await authService.logout(rawRefreshToken);

      const { maxAge, ...clearOptions } = getRefreshTokenCookieOptions();
      res.clearCookie('refreshToken', clearOptions);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json(createSuccessResponse({ user }));
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password, confirmPassword } = req.body;
      const result = await authService.resetPassword({ token, password, confirmPassword });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
