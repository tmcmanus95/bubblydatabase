const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SENDER_EMAIL_ADDRESS,
    pass: process.env.SENDER_EMAIL_PASSWORD,
  },
});

async function sendEmail({ to, subject, text }) {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
