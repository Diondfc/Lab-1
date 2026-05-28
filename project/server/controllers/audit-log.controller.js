const AuditLog = require('../models/audit-log.model');

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ limit: req.query.limit });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};
