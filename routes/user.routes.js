const UserController = require('../controllers/user.controller');
const {protect} = require('../middlewares/authN.middleware');

const express = require('express');

const router = express.Router();

router.get('/',protect,UserController.getAllUser);
router.get('/me', protect, UserController.getMe);

module.exports = router;
