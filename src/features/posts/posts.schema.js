//core

//third party
import mongoose from "mongoose";

//custom

export const postsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required:[true, "User ID of the post not specified"],
        ref: "User"
    },
    content : {
        type : String,
        required :[true, "Post content is required"],
    },
    image : {
        type : {
            publicId : {
                type: String,
                required: [true, "Image public id is missing"]
            },
            url : {
                type : String,
                required : [true, "Image URL is missing"]
            }
        },
        required : false // image is optional
    },
    visibility: {
        type: [
            {
                type: String,
                enum : {
                    values : ["public","allFriends", "general","close_friend","inner_circle"], // a post can be set to be visible to everyone, or to a specific group of people, or even to a combination of groups
                    message : "Invalid visibility parameter"
                }
            }
        ],
        default: ["allFriends"]
    },
    recentComment : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    likesCount : {
        type: Number,
        default: 0
    },
    commentsCount : {
        type: Number,
        default: 0
    },
},
{
    timestamps: true,
    collection: "posts"
});

export const PostModel = mongoose.model("Post",postsSchema);