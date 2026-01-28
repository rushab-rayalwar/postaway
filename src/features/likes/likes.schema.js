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

likesSchema.index({forPost:1, byUser:1}, {unique:true}); // NOTE THIS : avoids race condition by making sure that at the most only a single like exists for a pair of uesrID and postID

export const LikeModel = mongoose.model("Like",likesSchema);