const nodemailer = require("nodemailer");

module.exports = async ({ from, to, subject, text }) => {
  try {
    let options = {
      from,
      to,
      subject,
      text,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    return await transporter.sendMail(options);
  } catch (error) {
    console.log(error);
  }
};
