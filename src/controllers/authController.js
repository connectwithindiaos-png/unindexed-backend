const authService = require('../services/authService');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      if (err.message === 'Invalid email or password') {
        return res.status(401).json({ error: err.message });
      }
      next(err);
    }
  }

  async tokenLogin(req, res, next) {
    try {
      const { token } = req.body;
      const result = await authService.tokenLogin(token);
      res.json(result);
    } catch (err) {
      if (err.message === 'Invalid or inactive token') {
        return res.status(401).json({ error: err.message });
      }
      next(err);
    }
  }

  async verify(req, res) {
    const auth = req.admin || req.user;
    res.json({ auth, valid: true });
  }
}

module.exports = new AuthController();
