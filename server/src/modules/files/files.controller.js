const filesService = require('./files.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');

class FilesController {
  async list(req, res, next) {
    try {
      const items = await filesService.listFiles(req.params.workspaceId);
      res.status(200).json(createSuccessResponse({ items }));
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const file = await filesService.getFile(req.params.workspaceId, req.params.fileId);
      res.status(200).json(createSuccessResponse({ file }));
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, type, parentId, language, content } = req.body;
      const file = await filesService.createFile(req.params.workspaceId, {
        name,
        type,
        parentId,
        language,
        content
      });

      // Broadcast file:created event to workspace room
      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.FILE_CREATED, file);
      }

      res.status(201).json(createSuccessResponse({ file }));
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { name, parentId } = req.body;
      const file = await filesService.updateFile(req.params.workspaceId, req.params.fileId, {
        name,
        parentId
      });

      // Broadcast file:renamed event to workspace room
      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.FILE_RENAMED, file);
      }

      res.status(200).json(createSuccessResponse({ file }));
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await filesService.deleteFile(req.params.workspaceId, req.params.fileId);

      // Broadcast file:deleted event to workspace room
      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.FILE_DELETED, {
          workspaceId: req.params.workspaceId,
          fileId: req.params.fileId
        });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async duplicate(req, res, next) {
    try {
      const { name } = req.body;
      const file = await filesService.duplicateFile(req.params.workspaceId, req.params.fileId, { name });

      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.FILE_CREATED, file);
      }

      res.status(201).json(createSuccessResponse({ file }));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FilesController();
