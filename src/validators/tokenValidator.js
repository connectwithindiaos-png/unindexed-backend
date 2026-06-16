const createTokenSchema = {
  name: { required: true, type: 'string', minLength: 1, maxLength: 255, message: 'Name is required (1-255 characters)' },
};

module.exports = { createTokenSchema };
