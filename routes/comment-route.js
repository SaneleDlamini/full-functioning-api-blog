const express = require("express");
const Comment = require("../models/comment-model");
const Post = require("../models/post-model");
const auth = require("../middlewares/authentication");
const router = express.Router();

//This is not neccessary
router.get("/", async (req, res) => {
    try {
        const comments = await Comment.find();
        if(!comments){
            return res.status(404).json({ message : "No comment found" })
        };
        return res.status(200).json({ comments })
    } catch (error) {
        res.status(500).json({ message : `Failed to fetch comments due to ${error.message}` })
    }
});

router.post("/create/:postId", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        const comment = new Comment({
            ...req.body,
            author : req.user.userId,
            post : req.params.postId
        });
        const createdComment = await comment.save();
        post.comments.push(createdComment._id);
        await post.save();
        return res.status(201).json({ message : "Commented successfully!" });
    } catch (error) {
        res.status(500).json({ message : `Failed to comment due to ${error.message}` })
    }
});


router.put("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.author.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized to update this comment" });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            id,
            { $set: req.body }, 
            { new: true, runValidators: true }
        );

        return res.status(200).json({ message: "Comment updated successfully", updatedComment });
    } catch (error) {
        return res.status(500).json({ message: `Failed to update comment: ${error.message}` });
    }
});




router.delete("/:id", auth, async (req, res) => {
    try {
      const { id } = req.params;
  
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
  
      if (comment.author.toString() !== req.user.userId && !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized to delete this comment" });
      }
  
      await Post.findByIdAndUpdate(comment.post, { $pull: { comments: id } });
  
      await Comment.findByIdAndDelete(id);
  
      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete comment due to: ${error.message}` });
    }
  });
  

module.exports = router;