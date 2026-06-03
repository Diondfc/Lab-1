const RefreshTokens = require('../models/refresh-tokens-admin.model');

exports.getAll = async (_req, res) => {
  try {
    res.json(await RefreshTokens.getAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const token = await RefreshTokens.getById(req.params.id);
    if (!token) return res.status(404).json({ message: 'Refresh token not found' });
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await RefreshTokens.create(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const affectedRows = await RefreshTokens.update(req.params.id, req.body);
    if (!affectedRows) return res.status(404).json({ message: 'Refresh token not found' });
    res.json(await RefreshTokens.getById(req.params.id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.revoke = async (req, res) => {
  try {
    const affectedRows = await RefreshTokens.revoke(req.params.id);
    if (!affectedRows) return res.status(404).json({ message: 'Refresh token not found or already revoked' });
    res.json(await RefreshTokens.getById(req.params.id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const affectedRows = await RefreshTokens.delete(req.params.id);
    if (!affectedRows) return res.status(404).json({ message: 'Refresh token not found' });
    res.json({ message: 'Refresh token deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
