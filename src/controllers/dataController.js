const dataService = require('../services/dataService');

class DataController {
  async upload(req, res, next) {
    try {
      const { deviceId, smsMessages, contacts, files } = req.body;
      const result = await dataService.uploadDeviceData(deviceId, smsMessages, contacts, files);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getSms(req, res, next) {
    try {
      const sms = await dataService.getDeviceSms(req.params.id);
      res.json({ sms });
    } catch (err) {
      next(err);
    }
  }

  async getContacts(req, res, next) {
    try {
      const contacts = await dataService.getDeviceContacts(req.params.id);
      res.json({ contacts });
    } catch (err) {
      next(err);
    }
  }

  async getFiles(req, res, next) {
    try {
      const files = await dataService.getDeviceFiles(req.params.id);
      res.json({ files });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DataController();
