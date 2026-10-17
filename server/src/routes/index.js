const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const { createSuccessResponse } = require('../../../shared/contracts/apiSchemas');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json(createSuccessResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/workspaces', require('../modules/workspaces/workspaces.routes'));

// Accept invitation (authenticated)
const authenticate = require('../middleware/authenticate');
const workspacesController = require('../modules/workspaces/workspaces.controller');
router.post('/invitations/:token/accept', authenticate, workspacesController.acceptInvitation);

module.exports = router;
