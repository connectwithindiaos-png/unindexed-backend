const { Router } = require('express');
const apkController = require('../controllers/apkController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/apk', (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: 'Token user access required' });
  }
  req.params.id = req.user.tokenId;
  apkController.generate(req, res, next);
});

module.exports = router;
