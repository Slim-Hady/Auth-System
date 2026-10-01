const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user.controller');
const { protect } = require('../middlewares/authN.middleware');
const { restrictTo } = require('../middlewares/authZ.middleware');


router.use(protect);

router.get('/me', UserController.getMe);
router.use(restrictTo('admin'));

router
    .route('/')
    .get(UserController.getAllUsers)
    .post(UserController.createUser);
router
    .route('/:id')
    .get(UserController.getUser)
    .patch(UserController.updateUser)
    .delete(UserController.deleteUser);

module.exports = router;