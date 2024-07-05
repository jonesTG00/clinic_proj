const express = require("express");
const router = express.Router();

const { evaluateCode, verifyEmail } = require("../controllers/userController");

router.route("/verify-email").patch(verifyEmail);

module.exports = router;
