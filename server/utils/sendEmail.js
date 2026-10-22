const nodemailer = require("nodemailer");
require("dotenv").config();

// EMAIL_MODE=log: don't send anything; print a one-line summary and keep the message in `outbox`.
// Used by tests and staging so real people are never emailed from there.
const outbox = [];

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.SENDER_EMAIL_ADDRESS,
        pass: process.env.SENDER_EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

async function sendEmail({ to, subject, text }) {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ADDRESS,
    to,
    subject,
    text,
  };

  if (process.env.EMAIL_MODE === "log") {
    outbox.push(mailOptions);
    console.log(`[EMAIL_MODE=log] not sent: "${subject}" to ${to}`);
    return;
  }

  await getTransporter().sendMail(mailOptions);
}

module.exports = { sendEmail, outbox };
