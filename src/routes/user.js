const { Router } = require('express');
const apkController = require('../controllers/apkController');
const iconController = require('../controllers/iconController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'Token user access required' });
  }
  next();
}

router.get('/apk', requireUser, (req, res, next) => {
  req.params.id = req.user.tokenId;
  apkController.generate(req, res, next);
});

router.get('/apk/logs', requireUser, (req, res, next) => {
  req.params.id = req.user.tokenId;
  apkController.streamLogs(req, res, next);
});

router.post('/icon', requireUser, (req, res, next) => {
  req.params.id = req.user.tokenId;
  iconController.upload(req, res, next);
});

router.get('/icon', requireUser, (req, res, next) => {
  req.params.id = req.user.tokenId;
  iconController.get(req, res, next);
});

router.delete('/icon', requireUser, (req, res, next) => {
  req.params.id = req.user.tokenId;
  iconController.delete(req, res, next);
});

module.exports = router;
