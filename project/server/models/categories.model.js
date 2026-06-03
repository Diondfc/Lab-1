const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Categories'; const ID='CategoryID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (b)=>{
  const name = b.CategoryName ?? b.name;
  if (!name) throw new Error('CategoryName is required');
  const [r]=await db.query('INSERT INTO Categories (CategoryName, Description) VALUES (?,?)',[name, b.Description ?? b.description ?? null]);
  return exports.getById(r.insertId);
};
exports.update=async (id,b)=>{ const {set,values}=buildUpdate({CategoryName:b.CategoryName ?? b.name, Description:b.Description ?? b.description}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Categories SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
