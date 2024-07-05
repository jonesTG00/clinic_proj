const { unauthorized } = require("./errors/index");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const authenticate = (req, res, next) => {
  try {
    const auth = req.cookies.access_token;
    console.log(auth);
    const verify = jwt.verify(auth, process.env.JWT_SECRET);
    req.user = verify;
    console.log(req.user);
    next();
  } catch (error) {
    throw new unauthorized("Invalid credentials to access this");
  }
};

module.exports = { authenticate };
