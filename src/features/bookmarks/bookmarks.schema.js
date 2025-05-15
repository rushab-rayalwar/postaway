import mongoose from "mongoose";

export const bookmarksSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        required : [true,"User Id of the bookmark owner is required"],
        ref : "users"
    },
    postId : {
        type : mongoose.Schema.Types.ObjectId,
        required : [true,"Post Id of the post is required"],
        ref : "posts"
    },
    createdAt : {
        type: Date,
        default: new Date()
    }
});

export const BookmarkModel = mongoose.model("Bookmark",bookmarksSchema);