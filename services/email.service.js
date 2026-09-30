const {verifyConnection} = require('../config/email');
const {email_from_name, email_from_address} = require('../config/key');


    
class EmailService {

    static async sendEmail(to, subject, template, context){
        const option = {
            from: `"${email_from_name}" <${email_from_address}>`,
            to,
            subject,
            template,
            context
        };
        return await transport.sendMail(option);
    }

    static sendSignUpOTP(to, otp, name){   
        return this.sendEmail(
            to,
            "Verify Email",
            "signup-OTP",
            {
                name,
                otp
            }
        )
        // transport.sendMail({
        //     from: `"${email_from_name}" <${email_from_address}>`,
        //     to: to,
        //     subject: "verify Email",
        //     template: "signup-OTP",
        //     context: {
        //         name: name,
        //         otp: otp 
        //     }
        // }, (err, info) => {
        //     if(err){
        //         console.log(`error had occur ${err}`);
        //     }
        //     else {
        //         console.log(`Send email successfully`);
        //     }
        // })
    }
    static sendSignUpVerification(to, link,name){
        return this.sendEmail(
            to,
            "Verify Email",
            "signup-link",
            {
                name,
                link
            }
        )
        // transport.sendMail({
        //     from: `"${email_from_name}" <${email_from_address}>`,
        //     to: to,
        //     subject: "verify Email",
        //     template: "signup-link",
        //     context: {
        //         name: name,
        //         link: link 
        //     }
        // }, (err, info) => {
        //     if(err){
        //         console.log(`error had occur ${err}`);
        //     }
        //     else {
        //         console.log(`Send email successfully`);
        //     }
        // })

    }
    static sendForgetPasswordOTP(to, otp, name){
        return this.sendEmail(
            to,
            "Forget Password",
            "forget-password-otp",
            {
                name,
                otp
            }
        )
        // transport.sendMail({
        //     from: `"${email_from_name}" <${email_from_address}>`,
        //     to: to,
        //     subject: "Forget Password",
        //     template: "forget-password-otp",
        //     context: {
        //         name: name,
        //         otp: otp 
        //     }
        // }, (err, info) => {
        //     if(err){
        //         console.log(`error had occur ${err}`);
        //     }
        //     else {
        //         console.log(`Send email successfully`);
        //     }
        // })

    }

}

module.exports = EmailService;