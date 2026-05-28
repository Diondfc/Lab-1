const Role = require('../models/roles.model');

exports.getRoles = async (_req, res) => {
  try {
    res.json(await Role.findAll());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    res.status(201).json(await Role.create(req.body));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const affected = await Role.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ message: 'Role not found or no changes provided' });
    res.json(await Role.findById(req.params.id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const affected = await Role.delete(req.params.id);
    if (!affected) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
