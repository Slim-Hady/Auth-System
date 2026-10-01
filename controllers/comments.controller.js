const CommentService = require('../services/comment.service');
const catchAsync = require('../utils/catchAsync');

exports.getAllComments = catchAsync(async(req, res, next) => {
    const comments = await CommentService.getAllComments();
    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: { comments }
    });
});

exports.getComment = catchAsync(async(req, res, next) => {
    const comments = await CommentService.getComments(req.params.id);
    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: { comments }
    });
})
exports.deleteComment = catchAsync(async(req, res, next) => {
    const comments = await CommentService.deleteComments(req.params.id , req.user);
    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: { comments }
    });
})
exports.updateComment = catchAsync(async(req, res, next) => {
    const comments = await CommentService.updateComments(
        req.params.id, 
        req.body,
        req.user
    );
    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: { comments }
    });
})

exports.createComment = catchAsync(async (req, res, next) => {
    const comment = await CommentService.createComments(req.user, req.body);
    res.status(201).json({
        status: 'success',
        data: { comment }
    });
});