const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Publishers'; const ID='PublisherID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (b)=>{ const [r]=await db.query('INSERT INTO Publishers (Name) VALUES (?)',[b.Name]); return exports.getById(r.insertId); };
exports.update=async (id,b)=>{ const {set,values}=buildUpdate({Name:b.Name}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Publishers SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
