const Comment = require('../../models/Comment');
const File = require('../../models/File');
const { COMMENT_STATUS, ERROR_CODES } = require('../../../../shared/contracts/constants');
const { AppError } = require('../../middleware/errorHandler');

class CommentsService {
  async listComments(workspaceId, { fileId, status, page = 1, limit = 50 }) {
    const query = { workspaceId };
    if (fileId) query.fileId = fileId;
    if (status) query.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const total = await Comment.countDocuments(query);
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take);

    const items = comments.map((c) => ({
      id: c.id,
      workspaceId: c.workspaceId.toString(),
      fileId: c.fileId.toString(),
      author: c.author,
      body: c.body,
      status: c.status,
      anchor: c.anchor,
      replies: c.replies || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    return {
      items,
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async createComment(workspaceId, user, { fileId, body, anchor }) {
    if (!fileId || !body || !anchor) {
      throw new AppError('fileId, body, and anchor are required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const file = await File.findOne({ _id: fileId, workspaceId });
    if (!file) {
      throw new AppError('File not found in this workspace.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (typeof anchor.start !== 'number' || typeof anchor.end !== 'number') {
      throw new AppError('Anchor must have numeric start and end offsets.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const comment = await Comment.create({
      workspaceId,
      fileId,
      author: {
        id: user.id,
        name: user.name
      },
      body: body.trim(),
      status: COMMENT_STATUS.OPEN,
      anchor: {
        start: anchor.start,
        end: anchor.end
      },
      replies: []
    });

    return {
      id: comment.id,
      workspaceId: comment.workspaceId.toString(),
      fileId: comment.fileId.toString(),
      author: comment.author,
      body: comment.body,
      status: comment.status,
      anchor: comment.anchor,
      replies: [],
      createdAt: comment.createdAt
    };
  }

  async addReply(workspaceId, commentId, user, { body }) {
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      throw new AppError('Reply body is required.', 422, ERROR_CODES.VALIDATION_ERROR);
    }

    const comment = await Comment.findOne({ _id: commentId, workspaceId });
    if (!comment) {
      throw new AppError('Comment not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const reply = {
      author: {
        id: user.id,
        name: user.name
      },
      body: body.trim(),
      createdAt: new Date()
    };

    comment.replies.push(reply);
    await comment.save();

    const createdReply = comment.replies[comment.replies.length - 1];

    return {
      id: createdReply.id,
      author: createdReply.author,
      body: createdReply.body,
      createdAt: createdReply.createdAt
    };
  }

  async updateComment(workspaceId, commentId, user, { body }) {
    const comment = await Comment.findOne({ _id: commentId, workspaceId });
    if (!comment) {
      throw new AppError('Comment not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (comment.author.id !== user.id) {
      throw new AppError('Only the author can edit this comment.', 403, ERROR_CODES.UNAUTHORIZED);
    }

    if (body) {
      comment.body = body.trim();
      await comment.save();
    }

    return comment.toJSON();
  }

  async setStatus(workspaceId, commentId, status) {
    const comment = await Comment.findOne({ _id: commentId, workspaceId });
    if (!comment) {
      throw new AppError('Comment not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    comment.status = status;
    await comment.save();

    return {
      id: comment.id,
      workspaceId: comment.workspaceId.toString(),
      fileId: comment.fileId.toString(),
      status: comment.status
    };
  }

  async deleteComment(workspaceId, commentId, user) {
    const comment = await Comment.findOne({ _id: commentId, workspaceId });
    if (!comment) {
      throw new AppError('Comment not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    await Comment.deleteOne({ _id: commentId });
    return true;
  }
}

module.exports = new CommentsService();
