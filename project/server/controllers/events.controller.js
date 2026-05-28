const db = require('../config/db');
const Notification = require('../models/notification.model');
const { NOTIFICATION_TYPES } = require('../models/notification.model');

exports.getAllEvents = async (req, res) => {
  try {
      const [events] = await db.query(`
          SELECT 
              e.EventID,
              e.Title,
              DATE_FORMAT(e.Date, '%Y-%m-%d') AS Date,
              TIME_FORMAT(e.Time, '%H:%i') AS Time,
              el.Name AS Location,
              e.LocationID
          FROM Events e
          LEFT JOIN EventLocations el ON e.LocationID = el.LocationID
          ORDER BY e.Date ASC, e.Time ASC
      `);
      
      if (!events) {
          return res.status(200).json([]);
      }
      
      res.json(events);
  } catch (error) {
      console.error('Database error:', {
          message: error.message,
          sqlMessage: error.sqlMessage,
          stack: error.stack
      });
      res.status(500).json({ 
          error: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const [rows] = await db.query(
      `
          SELECT
              e.EventID,
              e.Title,
              DATE_FORMAT(e.Date, '%Y-%m-%d') AS Date,
              TIME_FORMAT(e.Time, '%H:%i') AS Time,
              el.Name AS Location,
              e.LocationID
          FROM Events e
          LEFT JOIN EventLocations el ON e.LocationID = el.LocationID
          WHERE e.EventID = ?
      `,
      [eventId],
    );

    if (!rows?.length) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.createEvent = async (req, res) => {
  try {
      const { Title, Date, Time, LocationID } = req.body;
      
      // Validate required fields
      if (!Title || !Date || !Time || !LocationID) {
          return res.status(400).json({ error: 'All fields are required' });
      }

      const [result] = await db.query(
          'INSERT INTO Events (Title, Date, Time, LocationID) VALUES (?, ?, ?, ?)',
          [Title, Date, Time, LocationID]
      );
      
      const [newEvent] = await db.query(`
          SELECT
              e.EventID,
              e.Title,
              DATE_FORMAT(e.Date, '%Y-%m-%d') AS Date,
              TIME_FORMAT(e.Time, '%H:%i') AS Time,
              el.Name AS Location,
              e.LocationID
          FROM Events e
          LEFT JOIN EventLocations el ON e.LocationID = el.LocationID
          WHERE e.EventID = ?
      `, [result.insertId]);

      const event = newEvent[0];
      await Notification.createForActiveUsers({
          title: 'New event added',
          message: `${event.Title} is scheduled for ${event.Date} at ${event.Time}.`,
          type: NOTIFICATION_TYPES.EVENT_CREATED,
          referenceType: 'Event',
          referenceId: event.EventID,
      });
      
      res.status(201).json(event);
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
          error: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Events WHERE EventID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
      const { Title, Date, Time, LocationID } = req.body;
      const eventId = req.params.id;

      // Validate required fields
      if (!Title || !Date || !Time || !LocationID) {
          return res.status(400).json({ error: 'All fields are required' });
      }

      const [result] = await db.query(
          'UPDATE Events SET Title = ?, Date = ?, Time = ?, LocationID = ? WHERE EventID = ?',
          [Title, Date, Time, LocationID, eventId]
      );

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Event not found' });
      }

      const [updatedEvent] = await db.query(`
          SELECT
              e.EventID,
              e.Title,
              DATE_FORMAT(e.Date, '%Y-%m-%d') AS Date,
              TIME_FORMAT(e.Time, '%H:%i') AS Time,
              el.Name AS Location,
              e.LocationID
          FROM Events e
          LEFT JOIN EventLocations el ON e.LocationID = el.LocationID
          WHERE e.EventID = ?
      `, [eventId]);

      res.json(updatedEvent[0]);
  } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ 
          error: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};
