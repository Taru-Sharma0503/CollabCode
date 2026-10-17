const express = require('express');
const workspacesController = require('./workspaces.controller');
const filesRouter = require('../files/files.routes');
const revisionsRouter = require('../revisions/revisions.routes');
const commentsRouter = require('../comments/comments.routes');
const Message = require('../../models/Message');
const { createSuccessResponse } = require('../../../../shared/contracts/apiSchemas');
const authenticate = require('../../middleware/authenticate');
const { authorizeWorkspace } = require('../../middleware/authorize');
const { ROLES } = require('../../../../shared/contracts/constants');

const router = express.Router();

router.use(authenticate);

// Workspace CRUD
router.get('/', workspacesController.list);
router.post('/', workspacesController.create);
router.get('/:workspaceId', authorizeWorkspace(ROLES.MEMBER), workspacesController.getById);
router.patch('/:workspaceId', authorizeWorkspace(ROLES.ADMIN), workspacesController.update);
router.delete('/:workspaceId', authorizeWorkspace(ROLES.OWNER), workspacesController.delete);

// Membership & Invitations
router.get('/:workspaceId/members', authorizeWorkspace(ROLES.MEMBER), workspacesController.getMembers);
router.post('/:workspaceId/invitations', authorizeWorkspace(ROLES.ADMIN), workspacesController.createInvitation);
router.patch('/:workspaceId/members/:userId', authorizeWorkspace(ROLES.ADMIN), workspacesController.updateMemberRole);
router.delete('/:workspaceId/members/:userId', authorizeWorkspace(ROLES.ADMIN), workspacesController.removeMember);

// Chat Message History REST endpoint
router.get('/:workspaceId/messages', authorizeWorkspace(ROLES.MEMBER), async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { before, limit = 50 } = req.query;

    const query = { workspaceId };
    if (before) {
      const beforeMsg = await Message.findById(before);
      if (beforeMsg) {
        query.createdAt = { $lt: beforeMsg.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Math.max(1, parseInt(limit, 10))));

    const items = messages.reverse().map((m) => ({
      id: m.id,
      workspaceId: m.workspaceId.toString(),
      sender: m.sender,
      body: m.body,
      clientMessageId: m.clientMessageId,
      createdAt: m.createdAt
    }));

    res.status(200).json(createSuccessResponse({ items }));
  } catch (err) {
    next(err);
  }
});

const executionsRouter = require('../executions/executions.routes');

// Mount nested routers
router.use('/:workspaceId/files', filesRouter);
router.use('/:workspaceId/revisions', revisionsRouter);
router.use('/:workspaceId/comments', commentsRouter);
router.use('/:workspaceId/executions', executionsRouter);

module.exports = router;
