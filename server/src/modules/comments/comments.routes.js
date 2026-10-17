const express = require('express');
const commentsController = require('./comments.controller');
const authenticate = require('../../middleware/authenticate');
const { authorizeWorkspace } = require('../../middleware/authorize');
const { ROLES } = require('../../../../shared/contracts/constants');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeWorkspace(ROLES.MEMBER));

router.get('/', commentsController.list);
router.post('/', commentsController.create);
router.post('/:commentId/replies', commentsController.reply);
router.patch('/:commentId', commentsController.update);
router.post('/:commentId/resolve', commentsController.resolve);
router.post('/:commentId/reopen', commentsController.reopen);
router.delete('/:commentId', commentsController.delete);

module.exports = router;
