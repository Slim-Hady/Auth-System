const AuthService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const {NODE_ENV, EMAIL_ENABLED , REFRESH_TOKEN_EXPIRES_IN} = require('../config/key');
const AppError = require('../utils/AppError');

exports.login = catchAsync(async (req, res,next) => {

    const {email , password} = req.body;

    const result = await AuthService.login({email, password});

    const {accessToken , refreshToken , user} = result;

    const cookieOption = {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
    res.cookie('refreshToken' , refreshToken , cookieOption);
    res.status(200).json({
        status: 'success',
        message: 'login successfully',
        accessToken,
        user
    });
})

exports.register = catchAsync(async (req, res, next) => {
        
        const user = await AuthService.register(req.body);

        res.status(201).json({
            status: 'success',
            message: EMAIL_ENABLED
                ? 'verification email sent, check your inbox to activate your account'
                : 'sign up successfully',
            user
        });

})

exports.verifyEmail = catchAsync(async(req, res, next) => {

    await AuthService.verifyEmail(req.body);
    res.status(200).json({
        status: 'success',
        message: 'Email verified successfully'
    })
})

exports.resendOTP = catchAsync(async(req,res,next) => {
    await AuthService.resendOTP(req.body);
    res.status(200).json({
        status: 'success',
        message: 'OTP Resend successfully'
    })
})

exports.forgetPassword = catchAsync(async(req,res,next) => {
    await AuthService.forgetPassword(req.body);
    res.status(200).json({
        status: 'success',
        message: 'OTP send successfully'
    })
});

exports.changePassword= catchAsync(async(req,res,next) => {
    await AuthService.changePassword(req.body);
    res.status(200).json({
        status: 'success',
        message: 'password changed successfully'
    })
});

exports.resetPassword = catchAsync(async(req,res,next)=>{
    const { oldPassword, newPassword } = req.body;
    if(!oldPassword || !newPassword){
        throw new AppError('old password or new password not provided', 400);
    }
    await AuthService.resetPassword({
        email: req.user.email,
        oldPassword,
        newPassword
    });
    res.status(200).json({
        status: 'success',
        message: 'password changed successfully'
    })
})

exports.resetWithOTP = catchAsync(async(req, res, next) => {
    const {email , otp , newPassword, confirmPassword} = req.body;
    if(!email || !otp || !newPassword || !confirmPassword){
        throw new AppError('You must fill all fields', 400);
    }
    await AuthService.resetWithOTP({email , otp , newPassword , confirmPassword});
    res.status(200).json({
        status: 'success',
        message: 'password updated successfully'
    })
});

exports.refresh = catchAsync(async(req, res, next)=> {
    const {accessToken} = await AuthService.refresh(req.cookies.refreshToken);
    res.status(200).json({
        status: 'success',
        accessToken
    });
});

// exports.logout = catchAsync(async (req, res, next) => {
//     const rawCookies = req.headers['cookie']; 
//     let accessToken = null;
//     if (rawCookies) {
//         const jwtCookie = rawCookies.split('; ').find(row => row.startsWith('jwt='));
//         if (jwtCookie) {
//             accessToken = jwtCookie.split('=')[1];
//         }
//     }
//     if (!accessToken) {
//         return res.status(204).send();
//     }
//     await AuthService.logout(accessToken);
//     res.setHeader('Clear-Site-Data', '"cookies"');
//     return res.status(200).json({ message: 'You are logged out!' });
// });