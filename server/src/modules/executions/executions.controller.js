const executionsService = require('./executions.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');

class ExecutionsController {
  async submit(req, res, next) {
    try {
      const { fileId, language, stdin } = req.body;
      const io = req.app.get('io');
      const execution = await executionsService.submitExecution(
        req.params.workspaceId,
        { fileId, language, stdin },
        io
      );
      res.status(202).json(createSuccessResponse({ execution }));
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const execution = await executionsService.getExecution(
        req.params.workspaceId,
        req.params.executionId
      );
      res.status(200).json(createSuccessResponse({ execution }));
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const io = req.app.get('io');
      const execution = await executionsService.cancelExecution(
        req.params.workspaceId,
        req.params.executionId,
        io
      );
      res.status(200).json(createSuccessResponse({ execution }));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExecutionsController();
