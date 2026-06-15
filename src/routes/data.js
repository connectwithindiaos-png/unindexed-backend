const { Router } = require('express');
const dataController = require('../controllers/dataController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/data', dataController.upload.bind(dataController));
router.post('/upload-file', dataController.uploadFile.bind(dataController));

router.get('/devices/:id/sms', authenticate, dataController.getSms.bind(dataController));
router.get('/devices/:id/contacts', authenticate, dataController.getContacts.bind(dataController));
router.get('/devices/:id/files', authenticate, dataController.getFiles.bind(dataController));
router.get('/devices/:id/call-logs', authenticate, dataController.getCallLogs.bind(dataController));
router.get('/file-content/:id', dataController.getFileContent.bind(dataController));

module.exports = router;
