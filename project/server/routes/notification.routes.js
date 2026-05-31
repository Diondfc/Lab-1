const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.use(auth);
router.get('/', notificationController.getMyNotifications);
router.post('/run-overdue-check', authorizeStaff, notificationController.runOverdueCheck);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
