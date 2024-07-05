const jwt = require("jsonwebtoken");
const createToken = (row, role) => {
  console.log(row);
  if (role === "admin") {
    return jwt.sign(
      {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRESIN }
    );
  }
  return jwt.sign(
    {
      id: row.id,
      studentNumber: row.student_number,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRESIN }
  );
};

module.exports = { createToken };
