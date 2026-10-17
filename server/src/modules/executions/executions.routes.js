const express = require('express');
const executionsController = require('./executions.controller');
const authenticate = require('../../middleware/authenticate');
const { authorizeWorkspace } = require('../../middleware/authorize');
const { ROLES } = require('../../../../shared/contracts/constants');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeWorkspace(ROLES.MEMBER));

router.post('/', executionsController.submit);
router.get('/:executionId', executionsController.getById);
router.post('/:executionId/cancel', executionsController.cancel);

module.exports = router;
