const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/authN.middleware');
const CommentController = require('../controllers/comments.controller');

router.get('/', CommentController.getAllComments);
router.get('/:id', CommentController.getComment);

router.post('/', protect, CommentController.createComment);
router.patch('/:id', protect, CommentController.updateComment);
router.delete('/:id', protect, CommentController.deleteComment);

module.exports = router;