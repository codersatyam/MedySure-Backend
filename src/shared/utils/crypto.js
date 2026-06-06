const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 12;

const hashPassword = (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateId = () => {
  return uuidv4();
};

module.exports = { hashPassword, comparePassword, generateId };
