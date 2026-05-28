const Tokens = require('../models/user-tokens.model');

exports.getAll = async (_req, res) => {
  try {
    res.json(await Tokens.getAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const token = await Tokens.getById(req.params.id);
    if (!token) return res.status(404).json({ message: 'User token not found' });
    return res.json(token);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await Tokens.create(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const affectedRows = await Tokens.update(req.params.id, req.body);
    if (!affectedRows) return res.status(404).json({ message: 'User token not found' });
    return res.json(await Tokens.getById(req.params.id));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const affectedRows = await Tokens.delete(req.params.id);
    if (!affectedRows) return res.status(404).json({ message: 'User token not found' });
    return res.json({ message: 'User token deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
