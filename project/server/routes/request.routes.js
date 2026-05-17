const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { auth } = require('../middlewares/auth');

router.get('/room/:room', requestController.getByRoom);

router.use(auth);
router.post('/', requestController.create);
router.put('/:id', requestController.update);
router.delete('/:id', requestController.remove);

module.exports = router;
