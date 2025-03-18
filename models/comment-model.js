const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    comment : {
        type : String,
    },
    post : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Post"
    },
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
});

module.exports = mongoose.model("Comment", commentSchema);