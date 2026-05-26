const Fine = require('../models/fine.model');
const { getUserId, isStaff } = require('../middlewares/auth');

const VALID_STATUSES = new Set(['Unpaid', 'Paid', 'Waived']);

function normalizeStatus(status) {
  if (!status) return null;
  const normalized = `${status}`.trim().toLowerCase();
  if (normalized === 'unpaid') return 'Unpaid';
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'waived') return 'Waived';
  return null;
}

function canAccessFine(req, fine) {
  return isStaff(req) || Number(fine.UserID) === Number(getUserId(req));
}

exports.getFines = async (req, res) => {
  try {
    const status = normalizeStatus(req.query.status);
    if (req.query.status && !status) {
      return res.status(400).json({ success: false, message: 'Invalid fine status' });
    }

    const userId = req.query.userId || (!isStaff(req) ? getUserId(req) : null);

    if (userId && !isStaff(req) && Number(userId) !== Number(getUserId(req))) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    const fines = userId
      ? await Fine.findByUser(userId, { status })
      : await Fine.findAll({ status });

    res.json({ success: true, data: fines });
  } catch (error) {
    console.error('Error fetching fines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fines',
      error: error.message,
    });
  }
};

exports.getFineById = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }

    if (!canAccessFine(req, fine)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    res.json({ success: true, data: fine });
  } catch (error) {
    console.error('Error fetching fine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fine',
      error: error.message,
    });
  }
};

exports.payFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }

    if (!canAccessFine(req, fine)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    if (fine.Status !== 'Unpaid') {
      return res.status(409).json({
        success: false,
        message: `Fine is already ${fine.Status.toLowerCase()}`,
      });
    }

    const affectedRows = await Fine.markPaid(req.params.id, req.body || {});
    if (!affectedRows) {
      return res.status(409).json({ success: false, message: 'Fine could not be paid' });
    }

    const updatedFine = await Fine.findById(req.params.id);
    res.json({ success: true, message: 'Fine paid successfully', data: updatedFine });
  } catch (error) {
    console.error('Error paying fine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pay fine',
      error: error.message,
    });
  }
};

exports.updateFineStatus = async (req, res) => {
  try {
    const status = normalizeStatus(req.body?.status);
    if (!status || !VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid fine status' });
    }

    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }

    const affectedRows = await Fine.updateStatus(req.params.id, {
      status,
      notes: req.body?.notes,
    });

    if (!affectedRows) {
      return res.status(409).json({ success: false, message: 'Fine status could not be updated' });
    }

    const updatedFine = await Fine.findById(req.params.id);
    res.json({ success: true, message: 'Fine status updated successfully', data: updatedFine });
  } catch (error) {
    console.error('Error updating fine status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fine status',
      error: error.message,
    });
  }
};
