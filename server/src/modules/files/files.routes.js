const express = require('express');
const filesController = require('./files.controller');
const authenticate = require('../../middleware/authenticate');
const { authorizeWorkspace } = require('../../middleware/authorize');
const { ROLES } = require('../../../../shared/contracts/constants');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeWorkspace(ROLES.MEMBER));

router.get('/', filesController.list);
router.post('/', filesController.create);
router.get('/:fileId', filesController.getById);
router.patch('/:fileId', filesController.update);
router.delete('/:fileId', filesController.delete);
router.post('/:fileId/duplicate', filesController.duplicate);

module.exports = router;
