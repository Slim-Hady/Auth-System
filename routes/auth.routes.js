const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login',authController.login);
router.post('/register',authController.register);
router.post('/verify', authController.verifyEmail);
router.post('/resend', authController.resendOTP);
module.exports = router;
