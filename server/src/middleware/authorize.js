const Membership = require('../models/Membership');
const Workspace = require('../models/Workspace');
const { AppError } = require('./errorHandler');
const { ROLES, ERROR_CODES } = require('../../../shared/contracts/constants');

const ROLE_HIERARCHY = {
  [ROLES.MEMBER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.OWNER]: 3
};

function authorizeWorkspace(requiredRole = ROLES.MEMBER) {
  return async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      if (!workspaceId) {
        return next(new AppError('workspaceId parameter is required.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return next(new AppError('Workspace not found.', 404, ERROR_CODES.NOT_FOUND));
      }

      const membership = await Membership.findOne({
        workspaceId: workspace._id,
        userId: req.user.id
      });

      if (!membership) {
        return next(new AppError('You are not a member of this workspace.', 403, ERROR_CODES.UNAUTHORIZED));
      }

      const userLevel = ROLE_HIERARCHY[membership.role] || 0;
      const requiredLevel = ROLE_HIERARCHY[requiredRole] || 1;

      if (userLevel < requiredLevel) {
        return next(new AppError(`Insufficient permissions. Required role: ${requiredRole}`, 403, ERROR_CODES.UNAUTHORIZED));
      }

      req.workspace = workspace;
      req.membership = membership;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  authorizeWorkspace,
  ROLE_HIERARCHY
};
