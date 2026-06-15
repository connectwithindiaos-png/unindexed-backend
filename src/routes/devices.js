const { Router } = require('express');
const deviceController = require('../controllers/deviceController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, heartbeatSchema } = require('../validators/deviceValidator');

const router = Router();

router.post('/register', validate(registerSchema), deviceController.register.bind(deviceController));
router.post('/heartbeat', validate(heartbeatSchema), deviceController.heartbeat.bind(deviceController));

router.get('/stats', authenticate, deviceController.getStats.bind(deviceController));
router.get('/', authenticate, deviceController.getAll.bind(deviceController));
router.get('/:id', authenticate, deviceController.getById.bind(deviceController));
router.delete('/:id', authenticate, deviceController.delete.bind(deviceController));

module.exports = router;
