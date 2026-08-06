const AuthService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const {NODE_ENV} = require('../config/key');

exports.login = catchAsync(async (req, res,next) => {

    const {email , password} = req.body;

    const result = await AuthService.login({email, password});

    const {token , user} = result;
    
    res.status(200).json({
        status: 'success',
        message: 'login successfully',
        token,
        user
    });
})

exports.register = catchAsync(async (req, res, next) => {

        const user = await AuthService.register(req.body);
    
        res.status(201).json({
            status: 'success',
            message: 'sign up successfully',
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