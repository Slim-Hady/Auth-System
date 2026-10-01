const UserService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await UserService.getAllUsers();
    
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await UserService.getUser(req.params.id);
    
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await UserService.getUser(req.user._id);
    
    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

exports.updateUser = catchAsync(async (req, res, next) => {
    const updatedUser = await UserService.updateUser(req.params.id, req.body);
    
    res.status(200).json({
        status: 'success',
        data: { user: updatedUser }
    });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const result = await UserService.deleteUser(req.params.id);
    
    res.status(200).json({
        status: 'success',
        message: result.message
    });
});

exports.createUser = catchAsync(async (req, res, next) => {
    const newUser = await UserService.createUser(req.body);
    
    res.status(201).json({
        status: 'success',
        data: { user: newUser }
    });
});