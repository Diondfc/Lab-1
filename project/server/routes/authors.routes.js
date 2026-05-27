const router = require('express').Router();
const c = require('../controllers/authors.controller');
const { auth, authorizeStaff } = require('../middlewares/auth');
router.get('/', auth, c.getAll);
router.get('/:id', auth, c.getById);
router.post('/', auth, authorizeStaff, c.create);
router.put('/:id', auth, authorizeStaff, c.update);
router.delete('/:id', auth, authorizeStaff, c.remove);
module.exports = router;
