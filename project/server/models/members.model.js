const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Members'; const ID='MemberID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (b)=>{ const [r]=await db.query('INSERT INTO Members (UserID, MembershipCode, IsActive) VALUES (?,?,?)',[b.UserID,b.MembershipCode,b.IsActive ?? 1]); return exports.getById(r.insertId); };
exports.update=async (id,b)=>{ const {set,values}=buildUpdate({MembershipCode:b.MembershipCode,IsActive:b.IsActive}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Members SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
