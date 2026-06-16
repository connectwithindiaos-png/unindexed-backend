const deviceService = require('../services/deviceService');

class DeviceController {
  async register(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const result = await deviceService.register(req.body, ip);
      res.status(result.isNew ? 201 : 200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async heartbeat(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip;
      const device = await deviceService.heartbeat(req.body.deviceId, ip);
      res.json({ device });
    } catch (err) {
      if (err.message === 'Device not found') {
        return res.status(404).json({ error: err.message });
      }
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const {
        search = '',
        status = '',
        sortBy = 'last_seen',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = req.query;

      const tokenId = req.user ? req.user.tokenId : null;

      const result = await deviceService.getAll({
        search,
        status,
        sortBy,
        sortOrder,
        page: parseInt(page, 10),
        limit: Math.min(parseInt(limit, 10), 100),
        tokenId,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const device = await deviceService.getById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      if (req.user) {
        const owns = await deviceService.verifyOwnership(req.params.id, req.user.tokenId);
        if (!owns) return res.status(403).json({ error: 'Access denied' });
      }
      res.json({ device });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      if (req.user) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const deleted = await deviceService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Device not found' });
      }
      res.json({ message: 'Device deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req, res, next) {
    try {
      const tokenId = req.user ? req.user.tokenId : null;
      const stats = await deviceService.getStats(tokenId);
      res.json({
        total: parseInt(stats.total, 10),
        online: parseInt(stats.online, 10),
        offline: parseInt(stats.offline, 10),
        registeredToday: parseInt(stats.registered_today, 10),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DeviceController();
