const Notification = require('../models/notification.model');
const { getUserId } = require('../middlewares/auth');

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await Notification.syncLoanReminders(userId);
    const notifications = await Notification.findForUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const affectedRows = await Notification.markRead(req.params.id, userId);

    if (!affectedRows) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: 'Error marking notification read' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const affectedRows = await Notification.markAllRead(userId);
    res.json({ message: 'Notifications marked as read', affectedRows });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ message: 'Error marking notifications read' });
  }
};
