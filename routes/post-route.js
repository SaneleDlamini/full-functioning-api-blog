const express = require("express");
const Post = require("../models/post-model");
const User = require("../models/user-model");
const Comment = require("../models/comment-model");
const auth = require("../middlewares/authentication")
const router = express.Router();
const mongoose = require("mongoose")

router.get("/", async (req, res) => {
    try {
        const posts = await Post.find().populate("author", "firstname lastname email") 
        .populate({
            path: "comments",
            populate: { path: "author", select: "firstname lastname email" } 
        });
        if(!posts){
            return res.status(404).json({ message : "No posts found" });
        }
        return res.status(200).json({ posts })
    } catch (error) {
        res.status(500).json({ message : `Failed to fetch posts due to ${error.message}` })
    }
});

router.post("/create", auth, async (req, res) => {
    try {
       const user = await User.findOne({ _id : req.user.userId });
       const post = new Post({
        ...req.body,
        author : req.user.userId,
        comments : []
       });
       if(!post){
        return res.status(400).json({ message : "Failed to create post" })
       }
       const savedPost = await post.save();
       user.posts.push(savedPost);
       await user.save();
       return res.status(201).json({ message : "Post created successfully!", post })
    } catch (error) {
        res.status(500).json({ message : `Failed to create posts due to ${error.message}` })
    }
}); 

router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findOne({ _id : req.params.id });
        if(!post){
            return res.status(404).json({ message : "Specified post coundn't found" })
        }
        return res.status(200).json({ post })
    } catch (error) {
        res.status(500).json({ message : `Failed to fetch post due to ${error.message}` })
    }
});

router.put("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized to update this post" });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { $set: req.body }, 
            { new: true, runValidators: true } 
        );

        return res.status(200).json({ message: "Post updated successfully", updatedPost });
    } catch (error) {
        return res.status(500).json({ message: `Failed to update post: ${error.message}` });
    }
});



router.delete("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        }

        await Comment.deleteMany({ _id: { $in: post.comments } });

        await Post.findByIdAndDelete(id);

        await User.findByIdAndUpdate(post.author, { $pull: { posts: id } });

        return res.status(200).json({ message: "Post and associated comments deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: `Failed to delete post due to: ${error.message}` });
    }
});

  

module.exports = router;





