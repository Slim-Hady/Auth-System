const nodemailer = require("nodemailer");
const {smtp_host, smtp_name,smtp_password,smtp_port, email, RESEND_API} = require('./key');
const path = require('path');
const hbs = require('nodemailer-express-handlebars').default;
const { Resend } = require('resend');

const resend = new Resend(RESEND_API);

const verifyConnection = async()=> {
    try {
        // NOTE: resend.apiKeys.list() does NOT throw on a bad key,
        // it returns { data, error } — so check .error explicitly
        const { error } = await resend.apiKeys.list();
        if (error) throw new Error(error.message);
        console.log("Email service is connected");
    }
    catch(err){
        console.log(`Email service not connected: ${err.message || err}`);
    }
}
module.exports = {resend ,verifyConnection};

// const transport = nodemailer.createTransport({
//   host: smtp_host,
//   port: smtp_port,
//   secure: false,
//   auth: {
//     user: smtp_name,
//     pass: smtp_password
//   }
// });



// const verifyEmailConnection = async () => {
//     try {
//        await transport.verify();
//        console.log(`Connect to Email service`);
//     }
//     catch (err){
//         console.log(`can't connect to email service ${err}`);
//     }
// }

// const option = {
//     viewEngine : {
//         extName: '.hbs',
//         partialsDir: path.resolve('./template'),
//         defaultLayout: false
//     },
//     extName: '.hbs',
//     viewPath: path.resolve('./template')
// }

// transport.use('compile' , hbs(option));

//console.log(hbs(option));

// module.exports = {transport , verifyEmailConnection};

