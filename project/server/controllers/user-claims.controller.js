const Claims = require('../models/user-claims.model');

exports.getAll = async (_req, res) => {
  try {
    res.json(await Claims.getAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const claim = await Claims.getById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'User claim not found' });
    return res.json(claim);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await Claims.create(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const affectedRows = await Claims.update(req.params.id, req.body);
    if (!affectedRows) return res.status(404).json({ message: 'User claim not found' });
    return res.json(await Claims.getById(req.params.id));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const affectedRows = await Claims.delete(req.params.id);
    if (!affectedRows) return res.status(404).json({ message: 'User claim not found' });
    return res.json({ message: 'User claim deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
