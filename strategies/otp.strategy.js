const VerificationStrategy = require("./verification.strategy");
const emailService = require('../services/email.service');

const crypto = require('crypto');
const bcrypt = require('bcrypt');

class OTPStrategy extends VerificationStrategy{
    
    async sendVerification(user , purpose = "signup"){
        const otp = this.generateOTP();
        const hashedOTP = await this.hashOTP(otp);
        const expirationDate = this.generateExpirationDate();
        await this.saveOTP(
            user,
            hashedOTP,
            expirationDate,
            purpose
        );
        if(purpose === "signup"){
            return await this.sendOTPEmail(
                user,
                otp
            );
        }
        return await this.sendForgetPassOTP(
            user,
            otp
        );
    }
     /**
     * 
     * @returns {int} generate 6 digits OTP
     */
    generateOTP(){
        return crypto.randomInt(100000, 1000000)
    }
    async hashOTP(otp){
        return bcrypt.hash(String(otp),10);
    }
    generateExpirationDate(){
        return new Date(Date.now() +10*60*1000);
    }
    async saveOTP(user, hashedOTP, expirationDate, purpose) {
        if(purpose === "signup"){
            user.verificationOTP = hashedOTP;
            user.verificationOTPExpires = expirationDate;
            return await user.save({validateBeforeSave: false});
        }
        user.resetOTP = hashedOTP;
        user.resetOTPExpires = expirationDate;
        return await user.save({validateBeforeSave: false});
    }
    async sendOTPEmail(user,otp){
        await emailService.sendSignUpOTP(
            user.email,
            otp,
            user.userName
        );
    }
    async sendForgetPassOTP(user,otp){
        await emailService.sendForgetPasswordOTP(
            user.email,
            otp,
            user.userName
        )
    }
}   

module.exports = OTPStrategy;