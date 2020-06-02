"use strict";

const nodemailer = require("nodemailer");
const settings = require('../config.json');

/*
* Send mail to corresponding mail list
* @param {String}, subject, represents mail's subject
* @param {String}, html, uses html document to repensent mail content
* @param {String}, mailType, one of ["test_report", "error_notice"]
*/
async function sendMail(subject, html, mailType) {
  let from = "";
  let to = "";
  if (mailType === "test_report") {
    from = settings.mail_test_report.from;
    to = settings.mail_test_report.to;
  } else {
    from = settings.mail_dev_notice.from;
    to = settings.mail_dev_notice.to;
  }

  // Create reusable transporter object
  let transporter = nodemailer.createTransport({
    host: "smtp.intel.com",
    port: 25,
    secure: false,
    auth: {
      user: "",
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
    from: from, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: html, // html body
  });
  return Promise.resolve();
}

module.exports = sendMail;