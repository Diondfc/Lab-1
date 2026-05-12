const db = require('../config/db');

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
      
      res.status(201).json(newEvent[0]);
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
