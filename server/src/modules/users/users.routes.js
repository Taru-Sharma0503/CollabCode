const express = require('express');
const usersController = require('./users.controller');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.patch('/me', usersController.updateProfile);
router.patch('/me/password', usersController.updatePassword);
router.get('/me/sessions', usersController.getSessions);
router.delete('/me/sessions/:sessionId', usersController.revokeSession);

module.exports = router;
