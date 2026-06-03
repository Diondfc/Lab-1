const db = require('../config/db');
const { buildUpdate, findAll, findById, removeById } = require('./generic-crud.model');
const TABLE='Members'; const ID='MemberID';
exports.getAll=async ()=>{
  const [rows]=await db.query(`
    SELECT m.*, u.Name AS AccountName, u.Email AS AccountEmail
    FROM Members m
    JOIN Users u ON u.UserID = m.UserID
    ORDER BY m.created_at DESC, m.MemberID DESC
  `);
  return rows;
};
exports.getById=(id)=>findById(TABLE,ID,id);
function memberStatus(b) {
  if (b.Status || b.status) return b.Status ?? b.status;
  return (b.IsActive ?? b.isActive ?? 1) ? 'Active' : 'Inactive';
}
exports.create=async (b)=>{
  const status = memberStatus(b);
  const [r]=await db.query(
    `INSERT INTO Members
     (UserID, FirstName, LastName, Email, Phone, Address, JoinedAt, MembershipCode, Status, IsActive)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      b.UserID ?? b.userId,
      b.FirstName ?? b.firstName ?? null,
      b.LastName ?? b.lastName ?? null,
      b.Email ?? b.email ?? null,
      b.Phone ?? b.phone ?? null,
      b.Address ?? b.address ?? null,
      b.JoinedAt ?? b.joinedAt ?? null,
      b.MembershipCode ?? b.membershipCode,
      status,
      status === 'Active' ? 1 : 0,
    ]
  );
  return exports.getById(r.insertId);
};
exports.update=async (id,b)=>{
  const status = b.Status !== undefined || b.status !== undefined || b.IsActive !== undefined || b.isActive !== undefined ? memberStatus(b) : undefined;
  const {set,values}=buildUpdate({
    UserID:b.UserID ?? b.userId,
    FirstName:b.FirstName ?? b.firstName,
    LastName:b.LastName ?? b.lastName,
    Email:b.Email ?? b.email,
    Phone:b.Phone ?? b.phone,
    Address:b.Address ?? b.address,
    JoinedAt:b.JoinedAt ?? b.joinedAt,
    MembershipCode:b.MembershipCode ?? b.membershipCode,
    Status:status,
    IsActive:status === undefined ? undefined : status === 'Active' ? 1 : 0,
  });
  if(!set.length) return 0; values.push(id); const [r]=await db.query(`UPDATE Members SET ${set.join(', ')} WHERE ${ID}=?`,values); return r.affectedRows;
};
exports.delete=(id)=>removeById(TABLE,ID,id);
