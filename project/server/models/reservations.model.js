const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Reservations'; const ID='ReservationID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);

exports.create=async (b)=>{
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [bookRows] = await conn.query('SELECT BookID, Quantity FROM Books WHERE BookID=? FOR UPDATE',[b.BookID]);
    if (!bookRows.length) throw new Error('Book not found');
    if (Number(bookRows[0].Quantity) > 0) throw new Error('Book has available copies; reservation not needed');

    const [memberRows] = await conn.query('SELECT MemberID, IsActive FROM Members WHERE MemberID=?',[b.MemberID]);
    if (!memberRows.length || !memberRows[0].IsActive) throw new Error('Active member not found');

    const [dup] = await conn.query("SELECT ReservationID FROM Reservations WHERE BookID=? AND MemberID=? AND Status='Active' LIMIT 1",[b.BookID,b.MemberID]);
    if (dup.length) throw new Error('Active reservation already exists for this member and book');

    const [r]=await conn.query("INSERT INTO Reservations (BookID, MemberID, ReservedAt, ExpiresAt, Status) VALUES (?,?,COALESCE(?,NOW()),?,COALESCE(?, 'Active'))",[b.BookID,b.MemberID,b.ReservedAt||null,b.ExpiresAt||null,b.Status||null]);
    await conn.commit();
    return await exports.getById(r.insertId);
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

exports.update=async (id,b)=>{ const {set,values}=buildUpdate({ExpiresAt:b.ExpiresAt,Status:b.Status}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Reservations SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
