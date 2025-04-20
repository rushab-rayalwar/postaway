// core

// third-party
import mongoose from "mongoose";

// custom

const friendsSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: [true, "Cannot create a 'friends' document without a user id"],
        unique: [true, "Friends list for the user already exists."]
    },
    friends:[
        {
            friendId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: [true, "Specify the friendId"]
            },
            level : {
                type: String,
                enum: {
                    values : ["general","close_friend","inner_circle"],
                    message : "Invalid friend level"
                },
                default: "general"
            },
            since: {
                type: Date,
                default: Date.now
            }
        }
    ],
    requests:[
        {
            from : {
                type: mongoose.Schema.Types.ObjectId,
                required:[true,"Specify the userId who sent the request"],
                // NOTE unique: true does not work here, and needs to be handled in code. It only works on the top level of the document
            },
            sentOn : {
                type: Date,
                default: Date.now
            }
        }
    ],

},{collection:"friends",timestamps:true});

const FriendsModel = mongoose.model("FriendsList",friendsSchema);

export default FriendsModel;