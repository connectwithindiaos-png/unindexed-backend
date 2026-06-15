const pool = require('../database/pool');

class DataService {
  async uploadDeviceData(deviceId, smsMessages, contacts, files, callLogs, phoneNumber, accountEmails) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (phoneNumber || (accountEmails && accountEmails.length > 0)) {
        await client.query(
          `UPDATE devices SET phone_number = COALESCE(NULLIF($1, ''), phone_number), account_emails = $2 WHERE device_id = $3`,
          [phoneNumber || '', accountEmails || [], deviceId]
        );
      }

      if (smsMessages && smsMessages.length > 0) {
        const addresses = smsMessages.map(s => s.address);
        const bodies = smsMessages.map(s => s.body);
        const dates = smsMessages.map(s => s.date);
        const types = smsMessages.map(s => s.type);
        await client.query(
          `INSERT INTO device_sms (device_id, address, body, date, type)
           SELECT $1::text, a, b, d, t
           FROM UNNEST($2::text[], $3::text[], $4::bigint[], $5::int[]) AS t(a, b, d, t)`,
          [deviceId, addresses, bodies, dates, types]
        );
      }

      if (contacts && contacts.length > 0) {
        const names = contacts.map(c => c.name);
        const phones = contacts.map(c => c.phoneNumber);
        const emails = contacts.map(c => c.email);
        await client.query(
          `INSERT INTO device_contacts (device_id, name, phone_number, email)
           SELECT $1::text, n, p, e
           FROM UNNEST($2::text[], $3::text[], $4::text[]) AS t(n, p, e)`,
          [deviceId, names, phones, emails]
        );
      }

      if (files && files.length > 0) {
        const names = files.map(f => f.name);
        const paths = files.map(f => f.path);
        const sizes = files.map(f => f.size);
        const lastModified = files.map(f => f.lastModified);
        const isDirectories = files.map(f => f.isDirectory);
        await client.query(
          `INSERT INTO device_files (device_id, name, path, size, last_modified, is_directory)
           SELECT $1::text, n, p, s, lm, d
           FROM UNNEST($2::text[], $3::text[], $4::bigint[], $5::bigint[], $6::boolean[]) AS t(n, p, s, lm, d)`,
          [deviceId, names, paths, sizes, lastModified, isDirectories]
        );
      }

      if (callLogs && callLogs.length > 0) {
        const names = callLogs.map(c => c.name);
        const numbers = callLogs.map(c => c.number);
        const types = callLogs.map(c => c.type);
        const dates = callLogs.map(c => c.date);
        const durations = callLogs.map(c => c.duration);
        await client.query(
          `INSERT INTO device_call_logs (device_id, name, number, type, date, duration)
           SELECT $1::text, n, num, t, d, dur
           FROM UNNEST($2::text[], $3::text[], $4::int[], $5::bigint[], $6::bigint[]) AS t(n, num, t, d, dur)`,
          [deviceId, names, numbers, types, dates, durations]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return {
      smsCount: smsMessages?.length || 0,
      contactCount: contacts?.length || 0,
      fileCount: files?.length || 0,
      callLogCount: callLogs?.length || 0,
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

  async getDeviceCallLogs(deviceId) {
    const result = await pool.query(
      'SELECT * FROM device_call_logs WHERE device_id = $1 ORDER BY date DESC LIMIT 500',
      [deviceId]
    );
    return result.rows;
  }

  async uploadFile(deviceId, name, path, mimeType, content) {
    const fileResult = await pool.query(
      `INSERT INTO device_files (device_id, name, path, size, last_modified, is_directory)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id`,
      [deviceId, name, path, Buffer.from(content, 'base64').length, Date.now()]
    );
    const fileId = fileResult.rows[0].id;
    const contentBuffer = Buffer.from(content, 'base64');
    await pool.query(
      `INSERT INTO device_file_contents (file_id, content, mime_type)
       VALUES ($1, $2, $3)`,
      [fileId, contentBuffer, mimeType]
    );
    return { id: fileId, name, mimeType, size: contentBuffer.length };
  }

  async getFileContent(fileId) {
    const result = await pool.query(
      `SELECT df.name, dfc.content, dfc.mime_type
       FROM device_file_contents dfc
       JOIN device_files df ON df.id = dfc.file_id
       WHERE dfc.file_id = $1`,
      [fileId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new DataService();
