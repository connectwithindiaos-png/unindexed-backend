const tokenService = require('../services/tokenService');

class TokenController {
  async create(req, res, next) {
    try {
      const { name } = req.body;
      const token = await tokenService.create(name, req.admin.id);
      res.status(201).json({ token });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const tokens = await tokenService.getAll();
      res.json({ tokens });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const token = await tokenService.getById(req.params.id);
      if (!token) return res.status(404).json({ error: 'Token not found' });
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }

  async toggleActive(req, res, next) {
    try {
      const token = await tokenService.toggleActive(req.params.id);
      if (!token) return res.status(404).json({ error: 'Token not found' });
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const deleted = await tokenService.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Token not found' });
      res.json({ message: 'Token deleted' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TokenController();
