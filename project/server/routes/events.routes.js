const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { auth, authorizeRoles } = require('../middlewares/auth');

// Public route - anyone can view events
router.get('/', eventsController.getAllEvents);

// Protected routes - only admins/librarians can create events
router.post('/', 
    auth, 
    authorizeRoles('Admin'), 
    eventsController.createEvent
);

router.delete('/:id', 
  auth,
  authorizeRoles('Admin'),
  eventsController.deleteEvent
);

router.put('/:id', 
  auth,
  authorizeRoles('Admin'),
  eventsController.updateEvent
);

module.exports = router;
