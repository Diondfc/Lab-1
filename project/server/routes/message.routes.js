const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { auth } = require('../middlewares/auth');

router.get('/room/:room', messageController.getByRoom);

router.use(auth);
router.post('/', messageController.create);
router.put('/:id', messageController.update);
router.delete('/:id', messageController.remove);

module.exports = router;
