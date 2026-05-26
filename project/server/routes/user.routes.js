const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

// Specific paths before /:id
router.get('/email/:email', auth, authorizeStaff, userController.getUserByEmail);

router.get('/', auth, authorizeStaff, userController.getAllUsers);
router.post('/', auth, authorizeStaff, userController.createUser);
router.patch('/:id/deactivate', auth, authorizeStaff, userController.deactivateUser);
router.patch('/:id/activate', auth, authorizeStaff, userController.activateUser);
router.get('/:id/roles', auth, authorizeStaff, userController.getUserRoles);
router.post('/:id/roles', auth, authorizeStaff, userController.assignRole);
router.delete('/:id/roles/:role', auth, authorizeStaff, userController.removeRole);
router.get('/:id/role-history', auth, userController.getRoleHistory);
router.get('/:id', auth, userController.getUserById);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, authorizeStaff, userController.deleteUserById);

module.exports = router;
