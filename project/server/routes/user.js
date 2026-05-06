const express = require('express');
const router = express.Router();
const userRepo = require('../repositories/userRepository');
const verifyToken = require('../middleware/auth');

// Get all users (only for admin)
router.get('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    const users = await userRepo.getAllUsers();
    res.json(users);
});

// Update user role
router.put('/:id/role', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    const { role } = req.body;
    await userRepo.updateUserRole(req.params.id, role);
    res.json({ message: 'Role updated' });
});

// Delete user
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    await userRepo.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
});

module.exports = router;