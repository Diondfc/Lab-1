const Roles = require('../models/roles.model');

exports.getAll = async (_req, res) => {
  try {
    res.json(await Roles.getAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const role = await Roles.getById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    return res.json(role);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await Roles.create(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const affectedRows = await Roles.update(req.params.id, req.body);
    if (!affectedRows) return res.status(404).json({ message: 'Role not found' });
    return res.json(await Roles.getById(req.params.id));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const affectedRows = await Roles.delete(req.params.id);
    if (!affectedRows) return res.status(404).json({ message: 'Role not found' });
    return res.json({ message: 'Role deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
