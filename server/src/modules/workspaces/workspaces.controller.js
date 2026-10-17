const workspacesService = require('./workspaces.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');

class WorkspacesController {
  async list(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await workspacesService.listWorkspaces(req.user.id, { page, limit });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, description, template } = req.body;
      const workspace = await workspacesService.createWorkspace(req.user.id, { name, description, template });
      res.status(201).json(createSuccessResponse({ workspace }));
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const workspace = await workspacesService.getWorkspace(req.params.workspaceId, req.user.id);
      res.status(200).json(createSuccessResponse({ workspace }));
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { name, description } = req.body;
      const workspace = await workspacesService.updateWorkspace(req.params.workspaceId, { name, description });
      res.status(200).json(createSuccessResponse({ workspace }));
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await workspacesService.deleteWorkspace(req.params.workspaceId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getMembers(req, res, next) {
    try {
      const members = await workspacesService.getMembers(req.params.workspaceId);
      res.status(200).json(createSuccessResponse({ members }));
    } catch (err) {
      next(err);
    }
  }

  async createInvitation(req, res, next) {
    try {
      const { email, role } = req.body;
      const invitation = await workspacesService.inviteMember(req.params.workspaceId, req.user.id, { email, role });
      res.status(201).json(createSuccessResponse({ invitation }));
    } catch (err) {
      next(err);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const { token } = req.params;
      const workspace = await workspacesService.acceptInvitation(token, req.user.id);
      res.status(200).json(createSuccessResponse({ workspace }));
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const { role } = req.body;
      const member = await workspacesService.updateMemberRole(req.params.workspaceId, req.params.userId, role, req.user.id);
      res.status(200).json(createSuccessResponse({ member }));
    } catch (err) {
      next(err);
    }
  }

  async removeMember(req, res, next) {
    try {
      await workspacesService.removeMember(req.params.workspaceId, req.params.userId, req.user.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkspacesController();
