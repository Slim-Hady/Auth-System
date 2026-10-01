const Comment = require('../models/comment.model');
const AppError = require('../utils/AppError');

class CommentService {

    static async getAllComments(){
        return await Comment.find({});
    }

    static async getComments(id){
        const comment = await Comment.findById(id);
        if(!comment){
            throw new AppError('comment not found', 404);
        }
        return comment;
    }

    static async deleteComments(id , currentUser){
        const comment = await Comment.findById(id);
        if(!comment){
            throw new AppError('comment not found', 404);
        }
        const isOwner = comment.author.toString() === currentUser._id.toString();
        const isAdmin = currentUser.role === "admin";
        if (!isOwner && !isAdmin) {
            throw new AppError('This is not your comment', 403);
        }
        await comment.deleteOne();
        return {message : "Comment deleted"};       
    }

    static async updateComments(id , data, currentUser){
        const comment = await Comment.findById(id);
        if(!comment){
            throw new AppError('comment not found', 404);
        }
        const isOwner = comment.author.toString() === currentUser._id.toString();
        if (!isOwner) {
            throw new AppError('This is not your comment', 403);
        }
        comment.content = data.content || comment.content;
        await comment.save();
        return comment;
    }

    static async createComments(user, data){
        const comment = await Comment.create(
            {
                ...data,
                author: user._id
            }
        );
        return comment;
    }

}

module.exports = CommentService;