const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, VERIFY_TYPE, EMAIL_ENABLED } = require('../config/key');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const userDTO = require('../dtos/user.dto');
const VerificationFactory = require('../factories/verification.factory');
const bcrypt = require('bcrypt');

class AuthService {
    /**
     * Login with email + password and return JWT + clean user.
     * When EMAIL_ENABLED=false the isVerified gate is skipped so you can
     * focus on AuthN/AuthZ without SMTP quota.
     *
     * @param {object} data
     * @param {string} data.email - user email from req.body
     * @param {string} data.password - plain password from req.body
     * @returns {Promise<{token: string, user: object}>} JWT to send as `Authorization: Bearer <token>` + cleaned user
     * @throws {AppError} 401 when email/password wrong, or not verified (only when email ON)
     */
    static async login({ email, password }) {
        const findUser = await User.findOne({ email }).select('+password');

        if (!findUser) {
            throw new AppError(`user email or password is not correct`, 401);
        }
        const isMatch = await findUser.comparePassword(password)

        if (!isMatch) {
            throw new AppError(`user email or password is not correct`, 401);
        }

        // Skip verification gate when email is OFF (dev mode)
        if (EMAIL_ENABLED && !findUser.isVerified) {
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
     * Mint a short-lived access JWT (the "ticket").
     *
     * @param {object} user - Mongoose user doc (needs id, userName, email, role)
     * @param {string} user.id
     * @param {string} user.userName - virtual firstName + secondName
     * @param {string} user.email
     * @param {string} user.role - "user" | "admin"
     * @returns {string} signed JWT header.payload.signature
     */
    static generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.userName,
            email: user.email,
            role: user.role
        }
        return jwt.sign(payload, JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN,
                issuer: "Auth-System"
            }
        )
    }

    /**
     *
     * @param {string} token - raw JWT without "Bearer " prefix
     * @returns {object} decoded payload {userId, email, role, iat, exp, iss}
     * @throws {AppError} 401 "Token expired" | 401 "Invalid token"
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new AppError('Token expired', 401);
            }
            else if (err.name === 'JsonWebTokenError') {
                throw new AppError('Invalid token', 401);
            }
            throw err;
        }
    }

    /**
     * Decode without verifying (debug only)
     *
     * @param {string} token - any JWT
     * @returns {object|null} {header, payload, signature} or null
     */
    static decodeToken(token) {
        return jwt.decode(token, { complete: true });
    }

    /**
     * Register a new user.
     * - 409 if email exists.
     * - Password hashed by pre('save') hook in user.model (bcrypt 12).
     * - If EMAIL_ENABLED=true: fire verification email via Factory (OTP/Link by VERIFY_TYPE).
     * - If EMAIL_ENABLED=false: auto-set isVerified=true so login works with no SMTP.
     *
     * @param {object} data
     * @param {string} data.firstName
     * @param {string} data.secondName
     * @param {string} data.email
     * @param {string} data.password - plain, will be hashed
     * @param {string} [data.role] - defaults "user", only admin should set "admin"
     * @returns {Promise<object>} cleaned user {username, email, role}
     * @throws {AppError} 409 "Email already exists."
     * @throws {AppError} 503 when the verification email fails to send (account rolled back, retry is clean)
     */
    static async register(data) {
        const { email } = data;
        if (await User.findOne({ email })) {
            throw new AppError(`Email already exists.`, 409);
        }
        const newUser = await User.create(data);

        if (EMAIL_ENABLED) {
            try {
                await AuthService.sendEmail(newUser, "signup");
            } catch (err) {
                await User.findByIdAndDelete(newUser._id);
                throw err;
            }
        } else {
            newUser.isVerified = true;
            await newUser.save({ validateBeforeSave: false });
        }
        // const strategy = sendEmail.createStrategy(VERIFY_TYPE);
        // await strategy.sendVerification(newUser);
        // const token = AuthService.generateToken(newUser);
        // return {
        //     token, 
        //     user: userDTO.formatUser(newUser)
        // }
        return userDTO.formatUser(newUser)
    }

    /**
     * Send verification email via Strategy+Factory (OTP or Link by VERIFY_TYPE).
     *
     * @param {object} user - Mongoose user doc
     * @param {string} [purpose="signup"] - "signup" writes verificationOTP*, "forget" writes resetOTP*
     * @returns {Promise<void>}
     * @throws {AppError} 503 when EMAIL_ENABLED=false
     */
    static async sendEmail(user, purpose = "signup") {
        if (!EMAIL_ENABLED) {
            throw new AppError('Email service is disabled (EMAIL_ENABLED=false)', 503);
        }
        const strategy = VerificationFactory.createStrategy(VERIFY_TYPE);
        await strategy.sendVerification(user, purpose);
    }

    /**
     *
     * @param {object} data
     * @param {string} data.email
     * @param {string|number} data.otp - plain code from inbox
     * @param {string} [purpose="signup"] - "signup" flips isVerified, "forget" does not
     * @returns {Promise<object>} cleaned user
     * @throws {AppError} 503 when disabled | 404 email not found | 400 invalid/expired OTP
     */
    static async verifyEmail({ email, otp }, purpose = "signup") {
        if (!EMAIL_ENABLED) {
            throw new AppError('Email verification is disabled (EMAIL_ENABLED=false)', 503);
        }
        const isSignup = purpose === "signup";
        const otpField = isSignup ? "verificationOTP" : "resetOTP"
        const expireField = isSignup ? "verificationOTPExpires" : "resetOTPExpires"

        const user = await User.findOne({ email }).select(`+${otpField} +${expireField}`);

        if (!user) throw new AppError("Email not found", 404);

        const match = await bcrypt.compare(String(otp), user[otpField] || '');

        if (!user[otpField] || user[expireField] < Date.now() || !match) {
            throw new AppError('Invalid or expired otp', 400);
        }

        if (isSignup) user.isVerified = true;
        user[otpField] = undefined;
        user[expireField] = undefined;
        await user.save({ validateBeforeSave: false });

        return userDTO.formatUser(user);
    }

    /**
     * Re-send signup OTP (for expired/lost codes).
     * TODO next: add 60s cooldown + "unverified only" check to stop inbox spam.
     *
     * @param {object} data
     * @param {string} data.email
     * @returns {Promise<void>}
     * @throws {AppError} 503 when disabled | 404 email not found
     */
    static async resendOTP({ email }) {
        if (!EMAIL_ENABLED) {
            throw new AppError('Email service is disabled (EMAIL_ENABLED=false)', 503);
        }
        const user = await User.findOne({ email });
        if (!user) throw new AppError("Email not found", 404);
        await AuthService.sendEmail(user, "signup");
    }

    /**
     *
     * @param {object} data
     * @param {string} data.email
     * @returns {Promise<void>}
     * @throws {AppError} 503 when disabled | 404 user not found
     */
    static async forgetPassword({ email }) {
        if (!EMAIL_ENABLED) {
            throw new AppError('Email service is disabled (EMAIL_ENABLED=false)', 503);
        }
        const user = await User.findOne({ email });
        if (!user) throw new AppError('user not found', 404);
        await AuthService.sendEmail(user, "forget");
    }

    /**
     * Reset password WITHOUT old password (for OTP-verified flow).
     *
     * @param {object} data
     * @param {string} data.email
     * @param {string} data.newPassword
     * @param {string} data.confirmPassword - must match newPassword
     * @returns {Promise<object>} cleaned user
     * @throws {AppError} 400 passwords don't match
     */
    static async changePassword({ email, newPassword, confirmPassword }) {
        if (newPassword !== confirmPassword) {
            throw new AppError("passwords don't match", 400);
        }
        const user = await User.findOne({ email });
        if (!user) throw new AppError("User not found", 404);
        user.password = newPassword;
        await user.save(); 
        return userDTO.formatUser(user);
    }

    /**
     * Change password WHILE LOGGED IN (needs old password).
     *
     * @param {object} data
     * @param {string} data.email - should come from req.user.email, not client
     * @param {string} data.oldPassword - current password for proof
     * @param {string} data.newPassword - will be hashed on save
     * @returns {Promise<object>} cleaned user
     * @throws {AppError} 404 user not exist | 401 old password wrong
     */
    static async resetPassword({ email, oldPassword, newPassword }) {
        const user = await User.findOne({ email }).select("+password");
        if (!user) throw new AppError("User not exist", 404);
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            throw new AppError("Old password is not correct", 401);
        }
        user.password = newPassword;
        await user.save();
        return userDTO.formatUser(user);
    }
    
    static async resetWithOTP( {email , otp , newPassword , confirmPassword}) {
        if (newPassword !== confirmPassword) {
            throw new AppError("passwords don't match", 400);
        }
        const user = await AuthService.verifyEmail({email,otp} , 'forget');
        await AuthService.changePassword({email , newPassword, confirmPassword});
        return user;
    }

    /*
    TODO: Logout
    TODO: refresh token
    TODO: BlackList
    */
}

module.exports = AuthService;
