// core

// libs
import mongoose from 'mongoose';

// custom

export const likesSchema = new mongoose.Schema({
    forPost : {
        type : mongoose.Schema.Types.ObjectId,
        ref :  "Posts"
    },
    byUser : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    createdAt : {
        type: Date,
        default : Date.now
    }
},{
    timestamps : true
});

export const LikeModel = mongoose.model("Like",likesSchema);