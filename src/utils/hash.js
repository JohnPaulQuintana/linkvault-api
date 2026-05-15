const bcrypt = require("bcrypt");

const hash = async (value) => {
  return await bcrypt.hash(value, 10);
};

const compare = async (value, hashed) => {
  return await bcrypt.compare(value, hashed);
};

module.exports = { hash, compare };