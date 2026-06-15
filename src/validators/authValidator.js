const loginSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Valid email is required',
  },
  password: {
    required: true,
    type: 'string',
    minLength: 6,
    message: 'Password must be at least 6 characters',
  },
};

module.exports = { loginSchema };
