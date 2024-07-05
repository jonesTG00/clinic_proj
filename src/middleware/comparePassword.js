const bcrypt = require("bcryptjs");

module.exports = async (toEval, hashedValue) => {
  return await bcrypt.compare(toEval, hashedValue);
};
