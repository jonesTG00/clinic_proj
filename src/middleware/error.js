const { StatusCodes } = require("http-status-codes");
const CustomError = require("./errors/customError");

const error = (err, req, res, next) => {
  console.log("error called");
  let customError = {
    status: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong, Please try again later",
  };

  if (err instanceof CustomError) {
    console.log("custom error");
    console.log(err);
    return res.status(err.statusCode).json({ msg: err.message });
  }

  if (err.status && err.status >= 1000 && err.status < 2000) {
    return res.status(err.status).json({ msg: err.message });
  }

  return res.status(customError.status).json({ msg: customError.message });
};

module.exports = error;
