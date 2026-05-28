const router = require('express').Router();
const rolesController = require('../controllers/roles.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, authorizeStaff, rolesController.getRoles);
router.get('/:id', auth, authorizeStaff, rolesController.getRoleById);
router.post('/', auth, authorizeStaff, rolesController.createRole);
router.put('/:id', auth, authorizeStaff, rolesController.updateRole);
router.delete('/:id', auth, authorizeStaff, rolesController.deleteRole);

module.exports = router;
