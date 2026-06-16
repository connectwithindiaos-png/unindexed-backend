const pool = require('../database/pool');

class AdminService {
  async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT d.id) AS total_devices,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'online') AS online_devices,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'offline') AS offline_devices,
        COUNT(DISTINCT t.id) AS total_tokens,
        COUNT(DISTINCT t.id) FILTER (WHERE t.is_active = true) AS active_tokens,
        COUNT(DISTINCT d.id) FILTER (WHERE d.token_id IS NOT NULL) AS assigned_devices
      FROM tokens t
      FULL JOIN devices d ON true
    `);
    const stats = result.rows[0];
    return {
      totalDevices: parseInt(stats.total_devices, 10),
      onlineDevices: parseInt(stats.online_devices, 10),
      offlineDevices: parseInt(stats.offline_devices, 10),
      totalTokens: parseInt(stats.total_tokens, 10),
      activeTokens: parseInt(stats.active_tokens, 10),
      assignedDevices: parseInt(stats.assigned_devices, 10),
    };
  }
}

module.exports = new AdminService();
