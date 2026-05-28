const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/room/:room', requestController.getByRoom);

router.use(auth);
router.post('/', requestController.create);
router.patch('/:id/status', authorizeStaff, requestController.updateStatus);
router.put('/:id', requestController.update);
router.delete('/:id', requestController.remove);

module.exports = router;
