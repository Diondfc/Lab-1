const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');

const TABLE='Authors'; const ID='AuthorID';
exports.getAll=()=>findAll(TABLE);
exports.getById=(id)=>findById(TABLE,ID,id);
function authorName(body) {
  const name = body.Name ?? body.name;
  if (name) return String(name).trim();
  return [body.FirstName ?? body.firstName, body.LastName ?? body.lastName].filter(Boolean).join(' ').trim();
}
exports.create=async (body)=>{
  const name = authorName(body);
  if (!name) throw new Error('Name or first/last name is required');
  const [r]=await db.query(
    'INSERT INTO Authors (Name,FirstName,LastName,Bio) VALUES (?,?,?,?)',
    [name, body.FirstName ?? body.firstName ?? null, body.LastName ?? body.lastName ?? null, body.Bio ?? body.bio ?? null]
  );
  return exports.getById(r.insertId);
};
exports.update=async (id,body)=>{
  const name = body.Name !== undefined || body.name !== undefined || body.FirstName !== undefined || body.firstName !== undefined || body.LastName !== undefined || body.lastName !== undefined
    ? authorName(body)
    : undefined;
  const {set,values}=buildUpdate({
    Name:name,
    FirstName:body.FirstName ?? body.firstName,
    LastName:body.LastName ?? body.lastName,
    Bio:body.Bio ?? body.bio,
  });
  if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Authors SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows;
};
exports.delete=(id)=>removeById(TABLE,ID,id);
