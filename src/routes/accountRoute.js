const express = require("express");
const router = express.Router();

const {
  createAccount,
  sendEmailVerificationCode,
  evaluateCode,
  verifyEmail,
  logIn,
} = require("../controllers/userController");

router.route("/sign-up").post(createAccount);
router.route("/verify-email").post(sendEmailVerificationCode);
router.route("/log-in").post(logIn);
module.exports = router;
