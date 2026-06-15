const pool = require('../database/pool');

class DataService {
  async uploadDeviceData(deviceId, smsMessages, contacts, files) {
    if (smsMessages && smsMessages.length > 0) {
      for (const sms of smsMessages) {
        await pool.query(
          `INSERT INTO device_sms (device_id, address, body, date, type)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [deviceId, sms.address, sms.body, sms.date, sms.type]
        );
      }
    }

    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        await pool.query(
          `INSERT INTO device_contacts (device_id, name, phone_number, email)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [deviceId, contact.name, contact.phoneNumber, contact.email]
        );
      }
    }

    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          `INSERT INTO device_files (device_id, name, path, size, last_modified, is_directory)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [deviceId, file.name, file.path, file.size, file.lastModified, file.isDirectory]
        );
      }
    }

    return {
      smsCount: smsMessages?.length || 0,
      contactCount: contacts?.length || 0,
      fileCount: files?.length || 0,
    };
  }

  async getDeviceSms(deviceId) {
    const result = await pool.query(
      'SELECT * FROM device_sms WHERE device_id = $1 ORDER BY date DESC LIMIT 500',
      [deviceId]
    );
    return result.rows;
  }

  async getDeviceContacts(deviceId) {
    const result = await pool.query(
      'SELECT * FROM device_contacts WHERE device_id = $1 ORDER BY name ASC',
      [deviceId]
    );
    return result.rows;
  }

  async getDeviceFiles(deviceId) {
    const result = await pool.query(
      'SELECT * FROM device_files WHERE device_id = $1 ORDER BY size DESC LIMIT 500',
      [deviceId]
    );
    return result.rows;
  }
}

module.exports = new DataService();
