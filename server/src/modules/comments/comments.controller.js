const commentsService = require('./comments.service');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');
const { SOCKET_EVENTS, ROOMS } = require('../../../../shared/contracts/socketEvents');
const { COMMENT_STATUS } = require('../../../../shared/contracts/constants');

class CommentsController {
  async list(req, res, next) {
    try {
      const { fileId, status, page, limit } = req.query;
      const result = await commentsService.listComments(req.params.workspaceId, {
        fileId,
        status,
        page,
        limit
      });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { fileId, body, anchor } = req.body;
      const comment = await commentsService.createComment(req.params.workspaceId, req.user, {
        fileId,
        body,
        anchor
      });

      // Broadcast comment:created to workspace room
      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.COMMENT_CREATED, comment);
      }

      res.status(201).json(createSuccessResponse({ comment }));
    } catch (err) {
      next(err);
    }
  }

  async reply(req, res, next) {
    try {
      const { body } = req.body;
      const reply = await commentsService.addReply(req.params.workspaceId, req.params.commentId, req.user, { body });
      res.status(201).json(createSuccessResponse({ reply }));
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { body } = req.body;
      const comment = await commentsService.updateComment(req.params.workspaceId, req.params.commentId, req.user, { body });
      res.status(200).json(createSuccessResponse({ comment }));
    } catch (err) {
      next(err);
    }
  }

  async resolve(req, res, next) {
    try {
      const comment = await commentsService.setStatus(req.params.workspaceId, req.params.commentId, COMMENT_STATUS.RESOLVED);

      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.COMMENT_RESOLVED, {
          workspaceId: req.params.workspaceId,
          commentId: req.params.commentId,
          status: COMMENT_STATUS.RESOLVED
        });
      }

      res.status(200).json(createSuccessResponse({ comment }));
    } catch (err) {
      next(err);
    }
  }

  async reopen(req, res, next) {
    try {
      const comment = await commentsService.setStatus(req.params.workspaceId, req.params.commentId, COMMENT_STATUS.OPEN);

      const io = req.app.get('io');
      if (io) {
        io.to(ROOMS.workspace(req.params.workspaceId)).emit(SOCKET_EVENTS.COMMENT_RESOLVED, {
          workspaceId: req.params.workspaceId,
          commentId: req.params.commentId,
          status: COMMENT_STATUS.OPEN
        });
      }

      res.status(200).json(createSuccessResponse({ comment }));
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await commentsService.deleteComment(req.params.workspaceId, req.params.commentId, req.user);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommentsController();
