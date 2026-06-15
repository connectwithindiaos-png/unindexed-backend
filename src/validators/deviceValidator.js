const registerSchema = {
  deviceId: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  deviceName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  androidVersion: {
    required: false,
    type: 'string',
    maxLength: 50,
  },
  appVersion: {
    required: false,
    type: 'string',
    maxLength: 50,
  },
};

const heartbeatSchema = {
  deviceId: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
};

module.exports = { registerSchema, heartbeatSchema };
