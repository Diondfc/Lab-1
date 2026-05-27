const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');

const TABLE='Authors'; const ID='AuthorID';
exports.getAll=()=>findAll(TABLE);
exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (body)=>{ const [r]=await db.query('INSERT INTO Authors (Name,Bio) VALUES (?,?)',[body.Name, body.Bio||null]); return exports.getById(r.insertId); };
exports.update=async (id,body)=>{ const {set,values}=buildUpdate({Name:body.Name,Bio:body.Bio}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Authors SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
