const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const UserDTO = require('../dtos/user.dto');

class UserService {

    static async getAllUsers(){
        const users = await User.find({});
        return UserDTO.formatAllUsers(users);
    }

    static async getUser(id){
        const user = await User.findById(id);
        if(!user){
            throw new AppError('user not found' , 404);
        }
        return UserDTO.formatUser(user);
    }

    static async updateUser(id , updatedDate){
        const updatedUser = await User.findByIdAndUpdate(id , updatedDate, {
            new: true,
            runValidators: true
        });
        if(!updatedUser){
            throw new AppError('User not found' ,404);
        }
        return UserDTO.formatUser(updatedUser);
        
    }

    static async deleteUser(id){
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return { message: 'User deleted successfully' };
    }

    static async createUser(userData){
        try {
            const user = await User.create(userData);
            return UserDTO.formatUser(user);
        }
        catch(err){
            if(err.code === 11000) {
                throw new AppError('User already exist' , 400);
            }
            throw err;
        }
    }

}

module.exports = UserService;