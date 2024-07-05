const express = require("express");
const router = express.Router();

const { initiateMedicalHistory } = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");

router.use(authenticate);
router.route("/add-medical-record").post(initiateMedicalHistory);

module.exports = router;
