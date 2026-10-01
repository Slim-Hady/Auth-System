const AppError = require('../utils/AppError');

exports.restrictTo = (...roles) => {
    return (req , res , next) => {
        if(!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(`u don't have permission for this action`,403));
        }
        next();
    }
}

