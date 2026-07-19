const nodemailer = require("nodemailer");
const {smtp_host, smtp_name,smtp_password,smtp_port, email} = require('./key');

const transport = nodemailer.createTransport({
  host: smtp_host,
  port: smtp_port,
  secure: false,
  auth: {
    user: smtp_name,
    pass: smtp_password
  }
});
 
module.exports = transport;

// transport.sendMail({
//   from: `Mohamed Hady ${email}`,
//   to: "A Test User <mohamed.mci.17.8@gmail.com>",
//   subject: "Hello from Mailtrap",
//   text: "This is a test e-mail message."
// }, (error, info) => {
//   if (error) {
//     return console.log(error);
//   }
//   console.log("Message sent: %s", info.messageId);
// });
