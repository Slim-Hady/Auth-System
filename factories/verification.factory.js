const otp = require('../strategies/otp.strategy.js');
const link = require('../strategies/link.strategy.js');
const AppError = require('../utils/AppError.js');
class VerificationFactory {
    static createStrategy(strategy) {
        switch (strategy) {
            case "otp": return new otp();
            case "link": return new link();
            default: throw new AppError('Invalid verification strategy', 400)
        }           
    }
}
module.exports = VerificationFactory;