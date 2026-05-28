const router = require('express').Router();
const rolesController = require('../controllers/roles.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, authorizeStaff, rolesController.getAll);
router.get('/:id', auth, authorizeStaff, rolesController.getById);
router.post('/', auth, authorizeStaff, rolesController.create);
router.put('/:id', auth, authorizeStaff, rolesController.update);
router.delete('/:id', auth, authorizeStaff, rolesController.remove);

module.exports = router;
