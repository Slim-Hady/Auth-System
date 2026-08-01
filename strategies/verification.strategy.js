class VerificationStrategy {
    async sendVerification(user){
        throw new Error("You must implement send verification");
    }
}
module.exports = VerificationStrategy;