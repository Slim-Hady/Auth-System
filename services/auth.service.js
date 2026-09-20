const jwt = require('jsonwebtoken');
const {JWT_SECRET, JWT_EXPIRES_IN, VERIFY_TYPE} = require('../config/key');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const userDTO = require('../dtos/user.dto');
const sendEmail = require('../factories/verification.factory');
const bcrypt =require('bcrypt');
const emailService = require('../services/email.service');
class AuthService {
    /**
     * 
     * @param {object} user
     * @param {string} user.email
     * @param {string} user.password
     * @returns {Promise<{token: string, user: object}>} -- return token to save it on (cookie or localStorage) and username,email,role if it used on frontend
     * @throws {AppError}
     */
    static async login(user){
        const {email , password} = user;
        const findUser = await User.findOne({email}).select('+password');
        
        if(!findUser){
            throw new AppError(`user email or password is not correct`, 401);
        }
        const isMatch =await findUser.comparePassword(password)

        if(!isMatch){
            throw new AppError(`user email or password is not correct`, 401);
        }
        
        if(!findUser.isVerified){
             throw new AppError(`user is not verified`, 401);
        }   

        const token = AuthService.generateToken(findUser);
        return {
            token,
            // user: {
            //     username: findUser.userName,
            //     email: findUser.email,
            //     role: findUser.role
            // }
            user: userDTO.formatUser(findUser)
        }
    }
    /**
     * 
     * @param {object} user
     * @param {string} user.id 
     * @param {string} user.username
     * @param {string} user.email
     * @param  {string} user.role
     * @returns {string} -- the json token header.payload.signature
     */
    static generateToken(user){
        const payload = {
            userId: user.id,
            username: user.userName,
            email: user.email,
            role: user.role
        }
        return jwt.sign(payload,JWT_SECRET, 
            {
                expiresIn:JWT_EXPIRES_IN,
                issuer: "Auth-System"
            }
        )
    }
    /**
     * 
     * @param {String} token
     * @param {String} secret_key
     * @returns {object} payload
     * @throws {AppError} TokenExpiredError
     * @throws {AppError} JsonWebTokenError
     */
    static verifyToken(token){
        try {
            return jwt.verify(token , JWT_SECRET);
        }
        catch(err){
            if(err.name === 'TokenExpiredError'){
                throw new AppError('Token expired', 401);
            }
            else if (err.name === 'JsonWebTokenError'){
                throw new AppError('Invalid token', 401);
            }
            throw err;
        }
    }
    /**
     * 
     * @param {String} token
     * @returns {String} token
     */
    static decodeToken(token){
        return jwt.decode(token, {complete: true});
    }

    // registration 
    static async register(user){
        const {email} = user;
        if(await User.findOne({email})) {
            throw new AppError(`Email already exists.`, 409);
        }
        const newUser =await User.create(user);
        AuthService.sendEmail(newUser, "signup");
        // const strategy = sendEmail.createStrategy(VERIFY_TYPE);
        // await strategy.sendVerification(newUser);
        // const token = AuthService.generateToken(newUser);
        // return {
        //     token, 
        //     user: userDTO.formatUser(newUser)
        // }
        return userDTO.formatUser(newUser)
    }
    static async sendEmail(user, purpose = "signup"){
        const strategy = sendEmail.createStrategy(VERIFY_TYPE);
        await strategy.sendVerification(user , purpose);
    }
   // verify email 
   static async verifyEmail({email,otp} , purpose = "signup"){
        const isSignup = purpose === "signup";
        const otpField = isSignup ? "verificationOTP" : "resetOTP"
        const expireField = isSignup ? "verificationOTPExpires" : "resetOTPExpires"

        const user = await User.findOne({email}).select(`+${otpField} +${expireField}`);

        if(!user) throw new AppError("Email not found", 404);

        const match = await bcrypt.compare(otp, user[otpField] || '');

        if(!user[otpField] || user[expireField] < Date.now() || !match) {
            throw new AppError('Invalid or expired otp', 400);
        }

        if(isSignup) user.isVerified = true;
        user[otpField] =  undefined;
        user[expireField] =  undefined;
        await user.save({validateBeforeSave: false});
        
        return userDTO.formatUser(user);

   }
   
   /**
    * @param {object} user
    * @return {string} otp
    */
    static async resendOTP({email}){
        const res = await User.findOne({email});
        if(!res) throw new AppError("Email not found", 404);
        AuthService.sendEmail(res);
   }
   
    static async forgetPassword({email}){
        const user = await User.findOne({email});
        if(!user) throw new AppError('user not found' , 404);
        AuthService.sendEmail(user , "forget");
    }
  
    async changePassword({email ,newPassword, confirmPassword}) {
        const user = await User.findOne({email});
        if(newPassword != confirmPassword) {
            throw new AppError("password don't match", 404);
        }
        user.password = newPassword;
        return userDTO.formatUser(user);
    }

    async resetPassword({email , oldPassword , newPassword}){
        const user = await User.findOne({email}).select("+password");
        if(!user) throw new AppError("User not exist" , 404);
        const isMatch = await user.comparePassword(oldPassword);
        if(!isMatch){
            throw new AppError("Password don't match", 401);
        }
        user.password = newPassword;
        await user.save();
        return userDTO.formatUser(user);
    }
   
}

module.exports = AuthService;