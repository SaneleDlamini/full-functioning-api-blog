const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const User = require("../models/user-model");
const Post = require("../models/post-model");
const auth = require("../middlewares/authentication");
const Comment = require("../models/comment-model")
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const user = await User.find();
        if(!user){
            return res.status(404).json({ message : "No users found" });
        }
        return res.status(200).json({ user })
    } catch (error) {
        res.status(400).json({ error })
    }
});

router.post("/register", async (req, res) => {
    try {
       const userExistance = await User.findOne({ email : req.body.email });
       if(userExistance){
        return res.status(200).json({ message : "User with this email already exists. Login" })
       }
       const salt = await bcrypt.genSalt(10)
       const hashedPassword = await bcrypt.hash(req.body.password, salt);
       const user = new User({
        ...req.body,
        password : hashedPassword,
        posts : []
       });
      
       await user.save();

       return res.status(201).json({ user })
    } catch (error) {
        res.status(500).json({ message : `Failed to register due to ${error.message}`})
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user){
            return res.status(404).json({ message : "Invali email" })
        }
        const comparePassword = await bcrypt.compare(password, user.password);
        if(!comparePassword){
            return res.status(400).json({ message : "Wrong password" });
        }
        const token = jwt.sign({ userId : user._id, isAdmin : user.isAdmin }, process.env.JWT_TOKEN, { expiresIn: "7d" });
        return res.status(200).json({ token, message : "Successfully loggedIn" });
    } catch (error) {
        return res.status(500).json({ message : `Failed to login due to ${error.message}` })
    }
});

router.get("/:id", async (req, res) => {
    try {
        const user = await User.findOne({ _id : req.params.id });
        if(!user){
            return res.status(404).json({ message : "No user found" })
        }
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message : `No user found due to : ${error.message}` })
    }
});


router.put("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.userId !== id && !req.user.isAdmin) {
            return res.status(403).json({ message: "Unauthorized to update this user" });
        }
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            { $set: req.body },
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", updatedUser });
    } catch (error) {
        return res.status(500).json({ message: `Update failed: ${error.message}` });
    }
});


router.delete("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.userId !== id && !req.user.isAdmin) {
            return res.status(403).json({ message: "Unauthorized to delete this user" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userPosts = user.posts;

        const postComments = await Comment.find({ post: { $in: userPosts } }).distinct("_id");

        await Comment.deleteMany({ $or: [{ author: id }, { _id: { $in: postComments } }] });

        await Post.deleteMany({ author: id });

        await Post.updateMany(
            { comments: { $in: postComments } },
            { $pull: { comments: { $in: postComments } } }
        );
        await User.findByIdAndDelete(id);

        return res.status(200).json({ message: "User, their posts, and all related comments deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: `Failed to delete user due to: ${error.message}` });
    }
});

module.exports = router;
