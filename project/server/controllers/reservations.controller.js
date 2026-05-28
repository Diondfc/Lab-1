const Reservation = require('../models/reservations.model');
const Notification = require('../models/notification.model');
const { getUserId } = require('../middlewares/auth');

exports.getAll = async (_req, res) => {
  try {
    res.json(await Reservation.getAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQueue = async (_req, res) => {
  try {
    res.json(await Reservation.getActiveQueue());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookQueue = async (req, res) => {
  try {
    res.json(await Reservation.getByBookId(req.params.bookId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const reservation = await Reservation.getById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Not found' });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createHold = async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookId = Number(req.body.bookId || req.body.BookID);

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }

    const reservation = await Reservation.createHold({ bookId, userId });
    res.status(201).json({
      message: 'Book reserved successfully',
      reservation,
    });
  } catch (error) {
    const status = /not found/i.test(error.message) ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const status = req.body?.status;
    if (!['Active', 'Fulfilled', 'Cancelled', 'Expired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid reservation status' });
    }

    const reservation = await Reservation.getById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Not found' });

    const affectedRows = await Reservation.updateStatus(req.params.id, status);
    if (!affectedRows) return res.status(404).json({ message: 'Not found' });

    if (status === 'Fulfilled') {
      await Notification.create({
        userId: reservation.UserID,
        title: 'Reserved book is ready',
        message: `"${reservation.BookTitle}" has been marked ready for you by the library staff.`,
        type: 'manual',
        referenceType: 'Reservation',
        referenceId: reservation.ReservationID,
      });
    }

    res.json(await Reservation.getById(req.params.id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
