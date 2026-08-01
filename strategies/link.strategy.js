const VerificationStrategy = require("./verification.strategy");
const emailService = require('../services/email.service');

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

class LinkStrategy extends VerificationStrategy{
    
    async sendVerification(user){
        const link = this.generateLink();
        const expirationDate = this.generateExpirationDate();
        await this.saveLink(
            user,
            link,
            expirationDate
        );
        await this.sendLinkEmail(
            user,
            link
        );
    }
     /**
     * 
     * @returns {hex} return 32 Token 
     */
    static generateLink(){
        return crypto.randomBytes(32).toString('hex');
    }
    generateExpirationDate(){
        return new Date(Date.now() + 24*60*60*1000);
    }
    async saveLink(user, link ,expirationDate) {
        user.verificationOTP = link;
        user.verificationOTPExpires = expirationDate;
        await user.save({validateBeforeSave: false});
    }
    async sendLinkEmail(user,link){
        await emailService.sendSignUpVerification(
            user.email,
            link,
            user.userName
        );
    }
}   

module.exports = LinkStrategy;