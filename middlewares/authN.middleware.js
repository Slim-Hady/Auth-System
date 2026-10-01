const AuthService = require('../services/auth.service');
const AppError = require('../utils/AppError');
const CatchAsync = require('../utils/catchAsync');
const User = require('../models/user.model')

exports.protect = CatchAsync(async (req, res, next) => {
    // // get the token from the cookie
    // const token = req.cookies?.accessToken;
    // or using bearer auth on the header there are authZ Bearer : token so we send the token on json
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // if there is not token so user not logged in
    if(!token) { 
        return next(new AppError(`You are not logged in, log in to get access.`, 401));
    }
    // verify the token if verified return the payload 
    const payload = AuthService.verifyToken(token);
    // saved on req.user for the next controller
    const user = await User.findById(payload.userId);
    if(!user){
        throw new AppError(`User no longer exists` , 401)
    }
    req.user = user;
    next();
})