const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middlewares/auth');

router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, userController.createUser);
router.delete('/:id', auth, userController.deleteUserById)
router.put("/:id", auth, userController.updateUser)
router.get('/email/:email', userController.getUserByEmail);

module.exports = router;