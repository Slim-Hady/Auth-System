const VerificationStrategy = require("./verification.strategy");
const emailService = require('../services/email.service');

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

class OTPStrategy extends VerificationStrategy{
    
    async sendVerification(user){
        const otp = this.generateOTP();
        const hashedOTP = this.hashOTP(otp);
        const expirationDate = this.generateExpirationDate();
        await this.saveOTP(
            user,
            hashedOTP,
            expirationDate
        );
        await this.sendOTPEmail(
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
        return bcrypt.hash(otp,10);
    }
    generateExpirationDate(){
        return new Date(Date.now() +10*60*1000);
    }
    async saveOTP(user, hashedOTP, expirationDate) {
        user.verificationOTP = hashedOTP;
        user.verificationOTPExpires = expirationDate;
        await user.save({validateBeforeSave: false});
    }
    async sendOTPEmail(user,otp){
        await emailService.sendSignUpOTP(
            user.email,
            otp,
            user.userName
        );
    }
}   

module.exports = OTPStrategy;