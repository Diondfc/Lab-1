const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

// Public routes — list and single event
router.get('/', eventsController.getAllEvents);
router.get('/:id', eventsController.getEventById);

// Protected routes — staff can manage events
router.post('/', auth, authorizeStaff, eventsController.createEvent);

router.delete('/:id', auth, authorizeStaff, eventsController.deleteEvent);

router.put('/:id', auth, authorizeStaff, eventsController.updateEvent);

module.exports = router;
