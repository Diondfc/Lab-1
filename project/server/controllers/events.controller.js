const db = require('../config/db');
const Notification = require('../models/notification.model');
const { NOTIFICATION_TYPES } = require('../models/notification.model');
const { getUserId } = require('../middlewares/auth');

function eventSelectSql(where = '') {
  return `
      SELECT
          e.EventID,
          e.Title,
          DATE_FORMAT(e.Date, '%Y-%m-%d') AS Date,
          TIME_FORMAT(e.Time, '%H:%i') AS Time,
          el.Name AS Location,
          e.LocationID,
          e.Capacity,
          COUNT(CASE WHEN er.Status = 'Reserved' THEN 1 END) AS ReservedSeats,
          GREATEST(e.Capacity - COUNT(CASE WHEN er.Status = 'Reserved' THEN 1 END), 0) AS SeatsRemaining,
          MAX(CASE WHEN er.UserID = ? THEN er.Status ELSE NULL END) AS MyReservationStatus
      FROM Events e
      LEFT JOIN EventLocations el ON e.LocationID = el.LocationID
      LEFT JOIN EventReservations er ON er.EventID = e.EventID
      ${where}
      GROUP BY e.EventID, e.Title, e.Date, e.Time, el.Name, e.LocationID, e.Capacity
  `;
}

exports.getAllEvents = async (req, res) => {
  try {
      const userId = getUserId(req) || 0;
      const [events] = await db.query(
        `${eventSelectSql()} ORDER BY e.Date ASC, e.Time ASC`,
        [userId],
      );
      
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
      eventSelectSql('WHERE e.EventID = ?'),
      [getUserId(req) || 0, eventId],
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
      const { Title, Date, Time, LocationID, Capacity } = req.body;
      
      // Validate required fields
      if (!Title || !Date || !Time || !LocationID) {
          return res.status(400).json({ error: 'All fields are required' });
      }
      const capacity = Math.max(Number(Capacity) || 50, 1);

      const [result] = await db.query(
          'INSERT INTO Events (Title, Date, Time, LocationID, Capacity) VALUES (?, ?, ?, ?, ?)',
          [Title, Date, Time, LocationID, capacity]
      );
      
      const [newEvent] = await db.query(eventSelectSql('WHERE e.EventID = ?'), [getUserId(req) || 0, result.insertId]);

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
      const { Title, Date, Time, LocationID, Capacity } = req.body;
      const eventId = req.params.id;

      // Validate required fields
      if (!Title || !Date || !Time || !LocationID) {
          return res.status(400).json({ error: 'All fields are required' });
      }

      const capacity = Math.max(Number(Capacity) || 50, 1);
      const [result] = await db.query(
          'UPDATE Events SET Title = ?, Date = ?, Time = ?, LocationID = ?, Capacity = ? WHERE EventID = ?',
          [Title, Date, Time, LocationID, capacity, eventId]
      );

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Event not found' });
      }

      const [updatedEvent] = await db.query(eventSelectSql('WHERE e.EventID = ?'), [getUserId(req) || 0, eventId]);

      res.json(updatedEvent[0]);
  } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ 
          error: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

exports.reserveSeat = async (req, res) => {
  const eventId = Number(req.params.id);
  const userId = Number(getUserId(req));

  if (!eventId || !userId) {
    return res.status(400).json({ message: 'Event and user are required' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [eventRows] = await conn.query(
      `SELECT EventID, Title, Capacity, Date, Time
       FROM Events
       WHERE EventID = ?
       FOR UPDATE`,
      [eventId],
    );

    if (!eventRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventRows[0];
    const [seatRows] = await conn.query(
      `SELECT COUNT(*) AS reservedSeats
       FROM EventReservations
       WHERE EventID = ? AND Status = 'Reserved'`,
      [eventId],
    );

    const reservedSeats = Number(seatRows[0]?.reservedSeats || 0);
    if (reservedSeats >= Number(event.Capacity)) {
      await conn.rollback();
      return res.status(409).json({ message: 'No seats available for this event' });
    }

    await conn.query(
      `INSERT INTO EventReservations (EventID, UserID, Status, ReservedAt, CancelledAt)
       VALUES (?, ?, 'Reserved', NOW(), NULL)
       ON DUPLICATE KEY UPDATE
         Status = 'Reserved',
         ReservedAt = NOW(),
         CancelledAt = NULL`,
      [eventId, userId],
    );

    await conn.commit();

    res.status(201).json({
      message: 'Seat reserved successfully',
      eventId,
      status: 'Reserved',
      seatsRemaining: Math.max(Number(event.Capacity) - reservedSeats - 1, 0),
    });
  } catch (error) {
    await conn.rollback();
    console.error('Event reservation error:', error);
    res.status(500).json({ message: 'Could not reserve seat' });
  } finally {
    conn.release();
  }
};

exports.cancelSeatReservation = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = Number(getUserId(req));

    const [result] = await db.query(
      `UPDATE EventReservations
       SET Status = 'Cancelled', CancelledAt = NOW()
       WHERE EventID = ? AND UserID = ? AND Status = 'Reserved'`,
      [eventId, userId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Active event reservation not found' });
    }

    res.json({ message: 'Seat reservation cancelled', eventId, status: 'Cancelled' });
  } catch (error) {
    console.error('Cancel event reservation error:', error);
    res.status(500).json({ message: 'Could not cancel reservation' });
  }
};

exports.getEventReservations = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        er.EventReservationID,
        er.EventID,
        er.UserID,
        er.Status,
        DATE_FORMAT(er.ReservedAt, '%Y-%m-%d %H:%i') AS ReservedAt,
        DATE_FORMAT(er.CancelledAt, '%Y-%m-%d %H:%i') AS CancelledAt,
        e.Title AS EventTitle,
        DATE_FORMAT(e.Date, '%Y-%m-%d') AS EventDate,
        TIME_FORMAT(e.Time, '%H:%i') AS EventTime,
        el.Name AS Location,
        u.Name AS UserName,
        u.Email AS UserEmail
      FROM EventReservations er
      JOIN Events e ON e.EventID = er.EventID
      LEFT JOIN EventLocations el ON el.LocationID = e.LocationID
      JOIN Users u ON u.UserID = er.UserID
      ORDER BY e.Date DESC, e.Time DESC, er.ReservedAt DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Event reservations list error:', error);
    res.status(500).json({ message: 'Could not load event reservations' });
  }
};

exports.cancelReservationByStaff = async (req, res) => {
  try {
    const reservationId = Number(req.params.reservationId);

    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    const [result] = await db.query(
      `UPDATE EventReservations
       SET Status = 'Cancelled', CancelledAt = NOW()
       WHERE EventReservationID = ? AND Status = 'Reserved'`,
      [reservationId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Active event reservation not found' });
    }

    res.json({ message: 'Reservation cancelled' });
  } catch (error) {
    console.error('Staff cancel event reservation error:', error);
    res.status(500).json({ message: 'Could not cancel event reservation' });
  }
};
