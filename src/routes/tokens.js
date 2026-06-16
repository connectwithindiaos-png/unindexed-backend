const { Router } = require('express');
const tokenController = require('../controllers/tokenController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createTokenSchema } = require('../validators/tokenValidator');

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', tokenController.getAll.bind(tokenController));
router.get('/:id', tokenController.getById.bind(tokenController));
router.post('/', validate(createTokenSchema), tokenController.create.bind(tokenController));
router.patch('/:id/toggle', tokenController.toggleActive.bind(tokenController));
router.delete('/:id', tokenController.delete.bind(tokenController));

module.exports = router;
