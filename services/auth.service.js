const jwt = require('jsonwebtoken');
const {JWT_SECRET, JWT_EXPIRES_IN} = require('../config/key');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const userDTO = require('../dtos/user.dto');

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
        // const token = AuthService.generateToken(newUser);
        // return {
        //     token, 
        //     user: userDTO.formatUser(newUser)
        // }
        return userDTO.formatUser(newUser)
    }
   
   
}

module.exports = AuthService;