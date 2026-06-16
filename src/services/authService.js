const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/pool');
const config = require('../config');
const { parseAdminInfo, parseTokenInfo } = require('../utils/helpers');

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
      { id: admin.id, email: admin.email, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      admin: parseAdminInfo(admin),
      role: 'admin',
    };
  }

  async tokenLogin(tokenStr) {
    const result = await pool.query(
      'SELECT * FROM tokens WHERE token = $1 AND is_active = true',
      [tokenStr]
    );

    const token = result.rows[0];
    if (!token) {
      throw new Error('Invalid or inactive token');
    }

    const jwtToken = jwt.sign(
      { role: 'user', tokenId: token.id, token: token.token },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token: jwtToken,
      user: parseTokenInfo(token),
      role: 'user',
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
