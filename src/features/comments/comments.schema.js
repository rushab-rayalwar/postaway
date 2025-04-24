//core

//libs
import mongoose from "mongoose";

//local

export const commentsSchema = new mongoose.Schema(
    {
        authorId : {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "User ID of the user commenting on the post is required"],
            ref: "User"
        },
        authorName : {
            type: String,
            required: [true, "User name of the user commenting on the post is required"]
        },
        postId : {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "Post Id for the comment is required"],
            ref : "Post"
        },
        content : {
            type: String,
            required: [true, "Comment content cannot be empty"]
        }
    }, 
    {
        timestamps:true,
        collection: "comments"
    }
);

export const CommentModel = mongoose.model("Comment", commentsSchema);