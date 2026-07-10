const User = require('../models/user.model');
const CatchAsync = require('../utils/catchAsync');
const userDTO = require('../dtos/user.dto');

exports.getAllUser = CatchAsync(async (req, res,next) => {
    const users = await User.find({});

    const cleanedUsers = userDTO.formatAllUsers(users);

    res.status(200).json({
        status: "success",
        data : {
            users: cleanedUsers
        }
    })
})