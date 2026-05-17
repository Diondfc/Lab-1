const Message = require('../models/message.model');

function getUserId(req) {
  return req.user?.id ?? req.user?.user?.id;
}

exports.getByRoom = async (req, res) => {
  try {
    const { room } = req.params;
    const messages = await Message.getByRoom(room);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { room, username, message, replyTo } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!room || !message?.trim()) {
      return res.status(400).json({ message: 'room and message are required' });
    }

    const id = await Message.create({
      room,
      userId,
      username: username || req.user?.email || 'User',
      message: message.trim(),
      replyTo: replyTo || null,
    });

    res.status(201).json({ id, room, message: message.trim() });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!message?.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    await Message.update(id, userId, message.trim());
    res.json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error('Error updating message:', error);
    const status = error.message.includes('not authorized') ? 403 : 500;
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

    await Message.delete(id, userId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    const status = error.message.includes('not authorized') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};
