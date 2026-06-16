const { Router } = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema, tokenLoginSchema } = require('../validators/authValidator');

const router = Router();

router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/token-login', validate(tokenLoginSchema), authController.tokenLogin.bind(authController));
router.get('/verify', authenticate, authController.verify.bind(authController));

module.exports = router;
