const UserController = require('../controllers/user.controller');
const {protect} = require('../middlewares/auth.middleware');

const express = require('express');

const router = express.Router();

router.get('/',protect,UserController.getAllUser);

module.exports = router;
