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

  async verify(req, res) {
    const { admin } = req;
    res.json({
      admin: { id: admin.id, email: admin.email },
      valid: true,
    });
  }
}

module.exports = new AuthController();
