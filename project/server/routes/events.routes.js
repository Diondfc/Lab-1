const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { auth, optionalAuth, authorizeStaff } = require('../middlewares/auth');

// Public routes — list and single event
router.get('/', optionalAuth, eventsController.getAllEvents);
router.get('/reservations', auth, authorizeStaff, eventsController.getEventReservations);
router.patch('/reservations/:reservationId/cancel', auth, authorizeStaff, eventsController.cancelReservationByStaff);
router.post('/:id/reserve', auth, eventsController.reserveSeat);
router.delete('/:id/reserve', auth, eventsController.cancelSeatReservation);
router.get('/:id', optionalAuth, eventsController.getEventById);

// Protected routes — staff can manage events
router.post('/', auth, authorizeStaff, eventsController.createEvent);

router.delete('/:id', auth, authorizeStaff, eventsController.deleteEvent);

router.put('/:id', auth, authorizeStaff, eventsController.updateEvent);

module.exports = router;
