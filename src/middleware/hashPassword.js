const bcrypt = require("bcryptjs");
module.exports = async (toHash) => {
  return await bcrypt.hash(toHash, await bcrypt.genSalt(10));
};
