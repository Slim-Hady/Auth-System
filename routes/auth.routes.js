const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {protect} = require('../middlewares/authN.middleware');

router.post('/login',authController.login);
router.post('/register',authController.register);
router.post('/verify', authController.verifyEmail);
router.post('/resend', authController.resendOTP);
router.patch('/resetPassword' , protect,authController.resetPassword);
router.post('/forget-password', authController.forgetPassword);
router.post('/reset-password', authController.resetWithOTP);
router.post('/refresh', authController.refresh);
// router.post('/logout', protect ,authController.logout );

module.exports = router;
