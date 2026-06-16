const pool = require('../database/pool');
const { parseDeviceInfo } = require('../utils/helpers');
const tokenService = require('./tokenService');

class DeviceService {
  async register(data, ip) {
    let tokenId = null;
    if (data.token) {
      const tok = await tokenService.getByToken(data.token);
      if (tok && tok.is_active) {
        tokenId = tok.id;
      }
    }

    const existing = await pool.query(
      'SELECT id FROM devices WHERE device_id = $1',
      [data.deviceId]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE devices SET
          device_name = $1, android_version = $2, app_version = $3,
          status = 'online', ip_address = $4, last_seen = NOW(), updated_at = NOW(),
          token_id = COALESCE($6, token_id)
        WHERE device_id = $5
        RETURNING *`,
        [data.deviceName, data.androidVersion, data.appVersion, ip, data.deviceId, tokenId]
      );
      return { device: parseDeviceInfo(result.rows[0]), isNew: false };
    }

    const result = await pool.query(
      `INSERT INTO devices (device_id, device_name, android_version, app_version, status, ip_address, last_seen, token_id)
       VALUES ($1, $2, $3, $4, 'online', $5, NOW(), $6)
       RETURNING *`,
      [data.deviceId, data.deviceName, data.androidVersion, data.appVersion, ip, tokenId]
    );

    return { device: parseDeviceInfo(result.rows[0]), isNew: true };
  }

  async heartbeat(deviceId, ip) {
    const result = await pool.query(
      `UPDATE devices SET status = 'online', ip_address = COALESCE($1, ip_address), last_seen = NOW(), updated_at = NOW()
       WHERE device_id = $2
       RETURNING *`,
      [ip, deviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }

    return parseDeviceInfo(result.rows[0]);
  }

  async getAll({ search, status, sortBy, sortOrder, page, limit, tokenId }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (tokenId) {
      conditions.push(`token_id = $${paramIndex}`);
      params.push(tokenId);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(device_name ILIKE $${paramIndex} OR device_id ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = ['last_seen', 'device_name', 'status', 'created_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'last_seen';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM devices ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT * FROM devices ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      devices: result.rows.map(parseDeviceInfo),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id) {
    const result = await pool.query(
      'SELECT * FROM devices WHERE id::text = $1 OR device_id = $1',
      [id]
    );
    return parseDeviceInfo(result.rows[0] || null);
  }

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM devices WHERE id::text = $1 OR device_id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  async getStats(tokenId) {
    const tokenCondition = tokenId ? 'WHERE token_id = $1' : '';
    const params = tokenId ? [tokenId] : [];

    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'online') AS online,
        COUNT(*) FILTER (WHERE status = 'offline') AS offline,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS registered_today
      FROM devices
      ${tokenCondition}
    `, params);
    return result.rows[0];
  }

  async verifyOwnership(deviceIdOrUuid, tokenId) {
    if (!tokenId) return false;
    const result = await pool.query(
      'SELECT id FROM devices WHERE (id::text = $1 OR device_id = $1) AND token_id = $2',
      [deviceIdOrUuid, tokenId]
    );
    return result.rows.length > 0;
  }

  async markOffline(threshold) {
    const result = await pool.query(
      `UPDATE devices SET status = 'offline', updated_at = NOW()
       WHERE status = 'online' AND last_seen < $1
       RETURNING id, device_id`,
      [threshold]
    );
    return result.rows;
  }

  async cleanupDeadDevices(threshold) {
    const result = await pool.query(
      `DELETE FROM devices WHERE status = 'offline' AND updated_at < $1`,
      [threshold]
    );
    return result.rowCount;
  }
}

module.exports = new DeviceService();
