const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='BookReviews'; const ID='ReviewID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (b)=>{ const [r]=await db.query('INSERT INTO BookReviews (BookID, MemberID, Rating, ReviewText) VALUES (?,?,?,?)',[b.BookID,b.MemberID,b.Rating,b.ReviewText||null]); return exports.getById(r.insertId); };
exports.update=async (id,b)=>{ const {set,values}=buildUpdate({Rating:b.Rating,ReviewText:b.ReviewText}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE BookReviews SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
