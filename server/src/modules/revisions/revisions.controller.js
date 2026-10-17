const revisionsService = require('./revisions.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');

class RevisionsController {
  async list(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await revisionsService.listRevisions(req.params.workspaceId, { page, limit });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async compare(req, res, next) {
    try {
      const { from, to } = req.query;
      const result = await revisionsService.compareRevisions(req.params.workspaceId, {
        fromId: from,
        toId: to
      });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const revision = await revisionsService.getRevision(req.params.workspaceId, req.params.revisionId);
      res.status(200).json(createSuccessResponse({ revision }));
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { message } = req.body;
      const revision = await revisionsService.createRevision(req.params.workspaceId, req.user, { message });
      res.status(201).json(createSuccessResponse({ revision }));
    } catch (err) {
      next(err);
    }
  }

  async restore(req, res, next) {
    try {
      const { expectedVersion } = req.body;
      const result = await revisionsService.restoreRevision(
        req.params.workspaceId,
        req.params.revisionId,
        req.user,
        { expectedVersion: parseInt(expectedVersion, 10) }
      );
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RevisionsController();
