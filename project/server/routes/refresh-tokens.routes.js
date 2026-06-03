const router = require('express').Router();
const controller = require('../controllers/refresh-tokens.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, authorizeStaff, controller.getAll);
router.get('/:id', auth, authorizeStaff, controller.getById);
router.post('/', auth, authorizeStaff, controller.create);
router.put('/:id', auth, authorizeStaff, controller.update);
router.patch('/:id/revoke', auth, authorizeStaff, controller.revoke);
router.delete('/:id', auth, authorizeStaff, controller.remove);

module.exports = router;
