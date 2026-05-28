const router = require('express').Router();
const tokensController = require('../controllers/user-tokens.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');

router.get('/', auth, authorizeStaff, tokensController.getAll);
router.get('/:id', auth, authorizeStaff, tokensController.getById);
router.post('/', auth, authorizeStaff, tokensController.create);
router.put('/:id', auth, authorizeStaff, tokensController.update);
router.delete('/:id', auth, authorizeStaff, tokensController.remove);

module.exports = router;
