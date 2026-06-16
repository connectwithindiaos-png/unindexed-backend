const adminService = require('../services/adminService');

class AdminController {
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
