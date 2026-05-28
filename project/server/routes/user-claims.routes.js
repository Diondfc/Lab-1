const router = require('express').Router();
const claimsController = require('../controllers/user-claims.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, authorizeStaff, claimsController.getAll);
router.get('/:id', auth, authorizeStaff, claimsController.getById);
router.post('/', auth, authorizeStaff, claimsController.create);
router.put('/:id', auth, authorizeStaff, claimsController.update);
router.delete('/:id', auth, authorizeStaff, claimsController.remove);

module.exports = router;
