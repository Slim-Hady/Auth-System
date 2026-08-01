const {Schema , model} = require('mongoose');
const validator = require('validator');

const commentSchema = new Schema({

    content: {
        type: String,
        required: [true, "Content must exist"],
        trim: true,
        maxLength: [500, "comment name exceed the 500 characters"]
    }, 
    author :{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
}, {timestamps: true});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;