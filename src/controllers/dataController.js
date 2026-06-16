const dataService = require('../services/dataService');
const deviceService = require('../services/deviceService');

class DataController {
  async upload(req, res, next) {
    try {
      const { deviceId, phoneNumber, accountEmails, smsMessages, contacts, files, callLogs } = req.body;
      const result = await dataService.uploadDeviceData(deviceId, smsMessages, contacts, files, callLogs, phoneNumber, accountEmails);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getSms(req, res, next) {
    try {
      if (req.user) {
        const owns = await deviceService.verifyOwnership(req.params.id, req.user.tokenId);
        if (!owns) return res.status(403).json({ error: 'Access denied' });
      }
      const sms = await dataService.getDeviceSms(req.params.id);
      res.json({ sms });
    } catch (err) {
      next(err);
    }
  }

  async getContacts(req, res, next) {
    try {
      if (req.user) {
        const owns = await deviceService.verifyOwnership(req.params.id, req.user.tokenId);
        if (!owns) return res.status(403).json({ error: 'Access denied' });
      }
      const contacts = await dataService.getDeviceContacts(req.params.id);
      res.json({ contacts });
    } catch (err) {
      next(err);
    }
  }

  async getFiles(req, res, next) {
    try {
      if (req.user) {
        const owns = await deviceService.verifyOwnership(req.params.id, req.user.tokenId);
        if (!owns) return res.status(403).json({ error: 'Access denied' });
      }
      const files = await dataService.getDeviceFiles(req.params.id);
      res.json({ files });
    } catch (err) {
      next(err);
    }
  }

  async getCallLogs(req, res, next) {
    try {
      if (req.user) {
        const owns = await deviceService.verifyOwnership(req.params.id, req.user.tokenId);
        if (!owns) return res.status(403).json({ error: 'Access denied' });
      }
      const callLogs = await dataService.getDeviceCallLogs(req.params.id);
      res.json({ callLogs });
    } catch (err) {
      next(err);
    }
  }

  async uploadFile(req, res, next) {
    try {
      const { deviceId, name, path, mimeType, content } = req.body;
      const result = await dataService.uploadFile(deviceId, name, path, mimeType, content);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getFileContent(req, res, next) {
    try {
      const fileContent = await dataService.getFileContent(req.params.id);
      if (!fileContent) {
        return res.status(404).json({ error: 'File content not found' });
      }
      res.set('Content-Type', fileContent.mime_type);
      res.set('Content-Disposition', `attachment; filename="${fileContent.name}"`);
      res.send(fileContent.content);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DataController();
