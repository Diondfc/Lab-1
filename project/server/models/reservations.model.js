const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Reservations'; const ID='ReservationID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (b)=>{ const [r]=await db.query('INSERT INTO Reservations (BookID, MemberID, ReservedAt, ExpiresAt, Status) VALUES (?,?,COALESCE(?,NOW()),?,COALESCE(?,\'Active\'))',[b.BookID,b.MemberID,b.ReservedAt||null,b.ExpiresAt||null,b.Status||null]); return exports.getById(r.insertId); };
exports.update=async (id,b)=>{ const {set,values}=buildUpdate({ExpiresAt:b.ExpiresAt,Status:b.Status}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Reservations SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
