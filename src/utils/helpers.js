function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      default: return `\\${char}`;
    }
  });
}

function parseDeviceInfo(device) {
  if (!device) return null;
  return {
    id: device.id,
    deviceId: device.device_id,
    deviceName: device.device_name,
    androidVersion: device.android_version,
    appVersion: device.app_version,
    status: device.status,
    ipAddress: device.ip_address,
    phoneNumber: device.phone_number || null,
    accountEmails: device.account_emails || null,
    lastSeen: device.last_seen,
    createdAt: device.created_at,
    updatedAt: device.updated_at,
  };
}

function parseAdminInfo(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    email: admin.email,
    createdAt: admin.created_at,
  };
}

module.exports = {
  sanitizeString,
  parseDeviceInfo,
  parseAdminInfo,
};
