//core

//libs
import mongoose from "mongoose";

//local

const commentsSchema = new mongoose.Schema(
    {
        authors : {
            type : [
                {
                    authorId : {
                        type : mongoose.Schema.Types.ObjectId,
                        required : [true, "Id of the user who posted the comment is required"],
                        ref : "User"
                    },
                    authorName : {
                        type : String,
                        required : [true, "Name of the user who posted the comment is required"]
                    }
                }
            ]
        },
        content : {
            type : String,
            required : [true, "Comment content cannot be empty"]
        },
        postId : {
            type : mongoose.Schema.Types.ObjectId,
            required : [true, "Post id is required for the comment to associate with"],
            ref : "Post"
        },
        isEdited : {
            type : Boolean,
            default : false
        }
    }, {timestamps:true}
)