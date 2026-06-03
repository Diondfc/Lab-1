const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Publishers'; const ID='PublisherID';
exports.getAll=()=>findAll(TABLE); exports.getById=(id)=>findById(TABLE,ID,id);
exports.create=async (b)=>{
  const name = b.Name ?? b.name;
  if (!name) throw new Error('Name is required');
  const [r]=await db.query('INSERT INTO Publishers (Name, Address, Phone) VALUES (?,?,?)',[name, b.Address ?? b.address ?? null, b.Phone ?? b.phone ?? null]);
  return exports.getById(r.insertId);
};
exports.update=async (id,b)=>{ const {set,values}=buildUpdate({Name:b.Name ?? b.name, Address:b.Address ?? b.address, Phone:b.Phone ?? b.phone}); if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Publishers SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows; };
exports.delete=(id)=>removeById(TABLE,ID,id);
