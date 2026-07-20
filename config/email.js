const nodemailer = require("nodemailer");
const {smtp_host, smtp_name,smtp_password,smtp_port, email} = require('./key');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');

const transport = nodemailer.createTransport({
  host: smtp_host,
  port: smtp_port,
  secure: false,
  auth: {
    user: smtp_name,
    pass: smtp_password
  }
});

const verifyEmailConnection = async ()=> {
    try {
       await transport.verify();
       console.log(`Connect to Email service`);
    }
    catch (err){
        console.log(`can't connect to email service ${err}`);
    }
}
const option = {
    viewEngine : {
        extname: '.hbs',
        partialsDir: path.resolve('./template'),
        defaultLayout: false
    },
    extname: '.hbs',
    viewPath: path.resolve('./template')
}

transport.use('compile' , hbs(option));

module.exports = {transport , verifyEmailConnection};

