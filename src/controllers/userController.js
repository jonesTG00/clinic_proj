const {
  badRequest,
  unauthorized,
  notFound,
} = require("../middleware/errors/index");
const uniqid = require("uniqid");
const { pool } = require("../db/db");
const { StatusCodes } = require("http-status-codes");
const hash = require("../middleware/hashPassword");
const compare = require("../middleware/comparePassword");
const nodeMail = require("../middleware/nodeMail");

const asyncWrapper = require("../utils/asyncWrapper");
const { createToken } = require("../middleware/createToken");
const medicalHistory = require("../db/models/medicalHistory");

const createAccount = asyncWrapper(async (req, res, next) => {
  const type = req.body.type;
  const info = { ...req.body };
  console.log(req.body);
  //MAKING ACCOUNT FOR ADMINS
  //CHECK IF EMAIL AND PASSWORD IS PRESENT

  if (!info.email || !info.password) {
    throw new badRequest("All fields must be filled");
  }

  // CHECKS IF VALID EMAIL ADDRESS FORMAT IS GIVEN
  if (
    !info.email.match(
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    )
  ) {
    throw new badRequest("Invalid email format");
  }

  // CHECKS IF EMAIL ALREADY EXISTS ON DATABASE
  const [rows, fields] = await pool.query(
    `SELECT * FROM clinic_${type} WHERE email = ?`,
    [info.email]
  );

  // IF EMAIL EXISTS CHECK IF IT IS ALREADY VERIFIED, IF YES PROCEED TO LOGGING IN
  // IF NOT DELETE FROM DATABASE AND CREATE NEW ONE
  if (rows[0]) {
    console.log(rows);
    if (rows[0].verified === 1) {
      throw new badRequest(
        "Email already registered and verified. Please proceed to logging in"
      );
    } else {
      await pool.execute(
        `DELETE FROM clinic_${type} WHERE id = "${rows[0].id}"`
      );
      console.log("Deleted previous account with same email address");
    }
  }

  // PASSWORD MUST BE 8 IN LENGTH, CONTAINS AT LEAST 1 UPPERCASE AND 1 NUMERIC CHARACTER
  if (info.password.length < 8 || !/(?=.*[A-Z])(?=.*\d)/.test(info.password)) {
    throw new badRequest(
      "Password must be at least 8 characters and must have at least 1 uppercase letter and 1 numeric character"
    );
  }
  ///// END OF VALIDATING EMAIL AND PASSWORD

  // VALIDATING NAME IF ADMIN IS BEING CREATED AND STUDENT NUMBER IF USER IS CREATED
  if (type == "admin") {
    if (!info.firstName || !info.lastName) {
      throw new badRequest("All fields must be filled");
    }

    // CHECKS IF VALID NAME FORMAT IS GIVEN
    if (
      !info.firstName.match(
        /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/
      ) ||
      !info.lastName.match(
        /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/
      )
    ) {
      throw new badRequest(
        "Invalid name characters detected. Must provide valid name."
      );
    }

    // CHECKS IF THERE IS A MIDDLE NAME AND IF THERE IS, IT MUST BE IN VALID NAME FORMAT
    if (
      info.middleName &&
      !info.middleName.match(
        /^[\w'\-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/
      )
    ) {
      throw new badRequest(
        "Invalid name characters detected. Must provide valid name."
      );
    }
  } else {
    // CHECKS IF THERE IS STUDENT NUMBER PASSED
    if (!info.studentNumber) {
      throw new badRequest("All fields must be filled");
    }

    // IF THERE IS, CHECKS IF THE PASSED STUDENT NUMBER IS EXISTING
    let [rows, fields] = await pool.query(
      `SELECT * FROM student_info WHERE student_number = ${info.studentNumber}`
    );

    if (!rows[0]) {
      throw new badRequest(
        "Student number entered doesn't exist. Please enter a valid student number"
      );
    }

    // IF THERE IS, CHECKS IF THE PASSED STUDENT NUMBER IS ALREADY REGISTERED
    [rows, fields] = await pool.query(
      `SELECT * FROM clinic_user WHERE student_number = ${info.studentNumber}`
    );

    console.log(rows);

    if (rows[0]) {
      throw new badRequest(
        "A user is already registered with this student number."
      );
    }
  }

  // CREATING QUERY
  const statement = `INSERT INTO clinic_${type} (id, email, password${
    type == "admin"
      ? `, first_name, middle_name, last_name`
      : ", student_number"
  }) VALUES (
        '${uniqid()}',
        ?,
        '${await hash(info.password)}',
        ${type == "admin" ? "?, ?, ?" : "?"}
      )`;

  let data = [info.email];
  if (type == "admin") {
    data.push(info.firstName, info.middleName, info.lastName);
  } else {
    data.push(info.studentNumber);
  }

  console.log(data);
  // INSERTING INTO DATABASE
  try {
    await pool.execute(statement, data);
    console.log("success");
    res.status(StatusCodes.CREATED).json({
      msg: `Email ${info.email} registed in database. Please verify your email now`,
    });
  } catch (error) {
    console.log(error);
  }
  console.log(`w ${uniqid()}`);
});

const sendEmailVerificationCode = asyncWrapper(async (req, res, next) => {
  const type = req.body.type;
  const email = req.body.email;
  const OTP = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  if (!type || !email) {
    throw new badRequest("Invalid varification request.");
  }

  const [rows, fields] = await pool.query(
    `SELECT * FROM ${type}_creation_otp WHERE email = "${email}"`
  );

  if (rows[0]) {
    const fiveminAfter = new Date(rows[0].createdAt);
    fiveminAfter.setTime(fiveminAfter.getTime() + 5 * 60 * 1000);
    const requestTime = Date.now();

    if (requestTime < fiveminAfter) {
      const minutesRemaining = Math.floor(
        (fiveminAfter.getTime() - requestTime) / (1000 * 60)
      );
      const secondsRemaining = Math.floor(
        ((fiveminAfter.getTime() - requestTime) % (1000 * 60)) / 1000
      );
      throw new badRequest(
        `Must wait ${minutesRemaining} minutes and ${secondsRemaining} seconds to make another OTP request.`
      );
    } else {
      await pool.execute(
        `DELETE FROM ${type}_creation_otp WHERE id = "${rows[0].id}"`
      );
    }
  }

  try {
    nodeMail({
      from: "heradurajones@gmail.com",
      to: email,
      subject: "Account verification OTP",
      text: `Your account verification OTP is ${OTP}. Please enter this within 5 minutes or this OTP will expire`,
    });

    const statement = `INSERT INTO ${type}_creation_otp (id, OTP, email) VALUES (
        '${uniqid()}',
        '${OTP}',
        '${email}'
      )`;
    await pool.execute(statement);

    res.status(StatusCodes.OK).json({ msg: `Email sent to ${email}` });
  } catch (error) {
    console.log(error);
  }
});

const evaluateCode = asyncWrapper(async (req, res, next) => {
  const type = req.body.type;
  const email = req.body.email;
  const toValidate = req.body.toValidate;

  if (!type || !email) {
    throw new badRequest("Invalid verification request.");
  }

  if (isNaN(toValidate)) {
    throw new badRequest("OTP must be a six-digit number");
  }

  const [rows, fields] = await pool.query(
    `SELECT * FROM ${type}_creation_otp WHERE email = "${email}"`
  );

  if (!rows[0]) {
    throw new badRequest("No request has been found for this email account.");
  }

  const fiveminAfter = new Date(rows[0].createdAt);
  fiveminAfter.setTime(fiveminAfter.getTime() + 5 * 60 * 1000);
  const requestTime = Date.now();

  if (requestTime > fiveminAfter) {
    throw new badRequest(
      "Your last OTP request is already expired. Please request for a new one"
    );
  }

  if (rows[0].OTP == toValidate) {
    await pool.execute(
      `DELETE FROM ${type}_creation_otp WHERE id = "${rows[0].id}"`
    );
    next();
  }
});

const verifyEmail = asyncWrapper(async (req, res, next) => {
  const type = req.body.type;
  const email = req.body.email;
  if (!email || !type) {
    console.log("verify email error");
  }
  await pool.execute(
    `UPDATE clinic_${type} SET verified = 1 WHERE email = "${email}"`
  );

  if (type == "user") {
    const [rows, fields] = await pool.query(
      `SELECT * FROM clinic_user WHERE email = ?`,
      [email]
    );
    const studentNumber = rows[0].student_number;
    const account_id = rows[0].id;

    await pool.query(
      `UPDATE student_info SET account_id = "${account_id}" WHERE student_number = ${studentNumber}`
    );
  }
  res.status(StatusCodes.OK).json({ msg: "Account verified" });
});

const logIn = asyncWrapper(async (req, res) => {
  const type = req.body.type;
  if ((!req.body.email && !req.body.studentNumber) || !req.body.password) {
    throw new badRequest("Must provide complete details");
  }

  const emailOrStudentNumber = req.body.email || req.body.studentNumber;
  const password = req.body.password;
  const [rows, field] = await pool.query(
    `SELECT * FROM clinic_${type} WHERE ${
      typeof emailOrStudentNumber === "number"
        ? `student_number = ${emailOrStudentNumber}`
        : `email = "${emailOrStudentNumber}"`
    }  `
  );

  if (!rows[0]) {
    throw new notFound(
      `No account found with ${emailOrStudentNumber} as email or student number`
    );
  }

  if (rows[0].verified == 0) {
    throw new badRequest(
      "Your account is not verified and must be verified first before logging in"
    );
  }

  if (rows[0]) {
    if (await compare(password, rows[0].password)) {
      const token = createToken(rows[0], type);
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res.status(StatusCodes.OK).json({
        msg: `Welcome ${
          type === "admin" ? `admin` : `student ${rows[0].student_number}`
        } `,
        token,
      });
    } else {
      throw new unauthorized("Wrong credentials");
    }
  }
});

const initiateMedicalHistory = asyncWrapper(async (req, res) => {
  const {
    vitalSigns,
    personalMedicalHistory,
    familyMedicalHistory,
    studentId,
  } = req.body;

  const { hospitalization, operation, trauma } = req.body || [];
  console.log(studentId);

  try {
    const [rows] = await pool.execute(
      "SELECT birthday FROM student_info WHERE student_number = ?",
      [studentId]
    );
    const birthyear = new Date(rows[0].birthday).getFullYear();

    if (!vitalSigns || !personalMedicalHistory || !familyMedicalHistory) {
      throw new badRequest("Required medical information not provided");
    }

    if (!studentId) {
      throw new badRequest("Must be logged in first");
    }

    if (hospitalization != []) {
      hospitalization.map((toCheck) => {
        if (
          !toCheck.hospital ||
          !toCheck.reason ||
          !toCheck.doctor ||
          !toCheck.yearStarted ||
          !toCheck.yearEnded
        ) {
          throw new badRequest(
            "Hospiatalization record is invalid. All fields are not filled"
          );
        }
        if (
          toCheck.yearStarted < birthyear ||
          toCheck.yearEnded < toCheck.yearStarted
        ) {
          throw new badRequest(
            "Hospitalization record is invalid. Check dates entered if valid."
          );
        }
      });
    }

    if (operation != []) {
      operation.map((toCheck) => {
        if (toCheck.year < birthyear) {
          throw new badRequest(
            "Operation record is invalid. Year diagnosed is before year born"
          );
        }
      });
    }

    if (trauma != []) {
      trauma.map((toCheck) => {
        if (toCheck.year < birthyear) {
          throw new badRequest(
            "Trauma record is invalid. Year diagnosed is before year born"
          );
        }
      });
    }

    await medicalHistory.create(
      studentId,
      familyMedicalHistory,
      personalMedicalHistory,
      hospitalization,
      operation,
      trauma,
      vitalSigns
    );

    await pool.execute(
      "UPDATE clinic_user SET medical_history_created = 1 WHERE student_number = ?",
      [studentId]
    );
    return res.status(StatusCodes.OK).json({
      msg: `Medical history created`,
      hospitalization,
      operation,
      trauma,
      vitalSigns,
      personalMedicalHistory,
      familyMedicalHistory,
      studentId,
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = {
  createAccount,
  sendEmailVerificationCode,
  evaluateCode,
  verifyEmail,
  logIn,
  initiateMedicalHistory,
};
