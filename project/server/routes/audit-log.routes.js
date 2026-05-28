const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/audit-log.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, authorizeStaff, auditLogController.getAuditLogs);

module.exports = router;
