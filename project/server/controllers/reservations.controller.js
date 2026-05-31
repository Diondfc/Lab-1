const M = require('../models/reservations.model');
exports.getAll = async (_q,r)=>{ try{r.json(await M.getAll())}catch(e){r.status(500).json({message:e.message})}};
exports.getById = async (q,r)=>{ try{const x=await M.getById(q.params.id); if(!x) return r.status(404).json({message:'Not found'}); r.json(x)}catch(e){r.status(500).json({message:e.message})}};
exports.create = async (q,r)=>{ try{r.status(201).json(await M.create(q.body))}catch(e){r.status(400).json({message:e.message})}};
exports.update = async (q,r)=>{ try{const a=await M.update(q.params.id,q.body); if(!a) return r.status(404).json({message:'Not found'}); r.json(await M.getById(q.params.id))}catch(e){r.status(400).json({message:e.message})}};
exports.remove = async (q,r)=>{ try{const a=await M.delete(q.params.id); if(!a) return r.status(404).json({message:'Not found'}); r.json({message:'Deleted'})}catch(e){r.status(500).json({message:e.message})}};
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

exports.expireReservations = async (_req, res) => {
  try {
    const expiredCount = await Reservation.expireActiveReservations();
    res.json({
      message: 'Reservation expiry processing completed',
      expiredCount,
    });
  } catch (error) {
    console.error('Error expiring reservations:', error);
    res.status(500).json({ message: 'Failed to expire reservations' });
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
