const Request = require('../models/request.model');
const Notification = require('../models/notification.model');
const { NOTIFICATION_TYPES } = require('../models/notification.model');

function getUserId(req) {
  return req.user?.id ?? req.user?.user?.id;
}

exports.getByRoom = async (req, res) => {
  try {
    const { room } = req.params;
    const requests = await Request.getByRoom(room);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching book requests:', error);
    res.status(500).json({ message: 'Error fetching book requests' });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { book_title, book_author, room, username } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!book_title?.trim() || !room) {
      return res
        .status(400)
        .json({ message: 'book_title and room are required' });
    }

    const created = await Request.create({
      userId,
      username: username || req.user?.email || 'User',
      book_title: book_title.trim(),
      book_author: book_author?.trim() || '',
      room,
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating book request:', error);
    const status = error.message.includes('already requested') ? 409 : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { book_title, book_author } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const updated = await Request.update(id, userId, {
      book_title,
      book_author,
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating book request:', error);
    const status = error.message.includes('not authorized') ? 403 : 404;
    res.status(status).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await Request.delete(id, userId);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting book request:', error);
    const status = error.message.includes('not authorized') ? 403 : 404;
    res.status(status).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body?.status;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pending, Approved, or Rejected' });
    }

    const updated = await Request.updateStatus(id, status);

    if (status === 'Approved') {
      await Notification.create({
        userId: updated.user_id,
        title: 'Book request approved',
        message: `Your request for "${updated.book_title}" was approved.`,
        type: NOTIFICATION_TYPES.REQUEST_APPROVED,
        referenceType: 'BookRequest',
        referenceId: updated.id,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating book request status:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};
