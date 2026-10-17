const express = require('express');
const revisionsController = require('./revisions.controller');
const authenticate = require('../../middleware/authenticate');
const { authorizeWorkspace } = require('../../middleware/authorize');
const { ROLES } = require('../../../../shared/contracts/constants');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeWorkspace(ROLES.MEMBER));

// Comparison endpoint defined BEFORE dynamic :revisionId
router.get('/compare', revisionsController.compare);

router.get('/', revisionsController.list);
router.post('/', revisionsController.create);
router.get('/:revisionId', revisionsController.getById);
router.post('/:revisionId/restore', revisionsController.restore);

module.exports = router;
