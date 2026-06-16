const { Router } = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', adminController.getStats.bind(adminController));

module.exports = router;
