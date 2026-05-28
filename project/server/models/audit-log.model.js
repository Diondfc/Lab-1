const db = require('../config/db');

function getRequestIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

class AuditLog {
  static async create({
    req,
    action,
    entityType,
    entityId = null,
    description,
    details = null,
  }) {
    const actorUserId = req?.user?.id || req?.user?.user?.id || null;
    const actorEmail = req?.user?.email || req?.user?.user?.email || null;
    const actorRole = req?.user?.role || req?.user?.user?.role || null;
    const detailsJson = details == null ? null : JSON.stringify(details);

    await db.query(
      `INSERT INTO AuditLogs
       (ActorUserID, ActorEmail, ActorRole, Action, EntityType, EntityID, Description, Details, IpAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actorUserId,
        actorEmail,
        actorRole,
        action,
        entityType,
        entityId,
        description,
        detailsJson,
        getRequestIp(req),
      ],
    );
  }

  static async findAll({ limit = 100 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const [rows] = await db.query(
      `SELECT
        AuditLogID,
        ActorUserID,
        ActorEmail,
        ActorRole,
        Action,
        EntityType,
        EntityID,
        Description,
        Details,
        IpAddress,
        CreatedAt
       FROM AuditLogs
       ORDER BY CreatedAt DESC, AuditLogID DESC
       LIMIT ?`,
      [safeLimit],
    );

    return rows.map((row) => {
      let details = row.Details;
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details);
        } catch {
          details = null;
        }
      }

      return {
        ...row,
        Details: details || null,
      };
    });
  }
}

module.exports = AuditLog;
