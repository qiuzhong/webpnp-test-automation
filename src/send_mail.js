"use strict";

const nodemailer = require("nodemailer");

async function sendMail(deviceInfo) {
  const htmlStyle = "<style>"
    + "table {border-collapse: collapse;}"
    + "table, td, th {border: 1px solid black;}"
    + "</style>";

  const mailContent = htmlStyle + deviceInfo;

  // Create reusable transporter object
  let transporter = nodemailer.createTransport({
    host: "smtp.intel.com",
    port: 25,
    secure: false,
    auth: {
      user: 'wanming.lin@intel.com',
      pass: "",
    },
  });

  // Verify transporter is avaliable
  transporter.verify(error => {
    if(error)
      console.error("transporter error: ", error);
    else
      console.log('server is ready to take our messages!');
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Wanming Lin" <wanming.lin@intel.com>', // sender address
    to: "wanming.lin@intel.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: mailContent, // html body
  });
  return Promise.resolve();
}

module.exports = sendMail;