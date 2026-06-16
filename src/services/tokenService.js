const crypto = require('crypto');
const pool = require('../database/pool');

class TokenService {
  async create(name, adminId) {
    const token = crypto.randomBytes(24).toString('hex');
    const result = await pool.query(
      `INSERT INTO tokens (token, name, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [token, name, adminId]
    );
    return result.rows[0];
  }

  async getAll() {
    const result = await pool.query(
      `SELECT t.*, COUNT(d.id)::int AS device_count
       FROM tokens t
       LEFT JOIN devices d ON d.token_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC`
    );
    return result.rows;
  }

  async getById(id) {
    const result = await pool.query(
      `SELECT t.*, COUNT(d.id)::int AS device_count
       FROM tokens t
       LEFT JOIN devices d ON d.token_id = t.id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getByToken(token) {
    const result = await pool.query(
      'SELECT * FROM tokens WHERE token = $1',
      [token]
    );
    return result.rows[0] || null;
  }

  async toggleActive(id) {
    const result = await pool.query(
      `UPDATE tokens SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    await pool.query(
      `UPDATE devices SET token_id = NULL WHERE token_id = $1`,
      [id]
    );
    const result = await pool.query(
      'DELETE FROM tokens WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }
}

module.exports = new TokenService();
