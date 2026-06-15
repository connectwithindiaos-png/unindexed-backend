const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/pool');
const config = require('../config');
const { parseAdminInfo } = require('../utils/helpers');

class AuthService {
  async login(email, password) {
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const admin = result.rows[0];
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      admin: parseAdminInfo(admin),
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      return null;
    }
  }
}

module.exports = new AuthService();
