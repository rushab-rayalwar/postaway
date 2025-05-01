// core

// libs
import mongoose from "mongoose";

// custom
import { UserModel } from "../users/users.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import FriendsModel from "../friends/friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js"

export default class FeedRepository{
    constructor(){

    }

    // async getPosts(userId, limit, cursor){
    //     userId = new mongoose.Types.ObjectId(userId);
    //     try {
    //         // validate the user ID
    //         let user = await UserModel.findById(userId);
    //         if(!user) {
    //             return {success: false, statusCode: 400, errors: ["User requesting the feed is not registered"]};
    //         }

    //         // get user's friends
    //         let userFriendsObject = await FriendsModel.findOne({ userId: userId }).lean();
    //         if(!userFriendsObject){
    //             throw new ApplicationError(500,"Could not find friends document for an existing user");
    //         }

    //         let userFriendsObjectsArray = userFriendsObject.friends; // an array of objects containing userId, friend-level and the time since the friendship exists
            
    //         // get posts from friends accessible to the user
    //         let posts = await PostModel.aggregate([
    //             {
    //                 $match : {
    //                     $or: [
    //                         {
    //                             visibility : "public" // either the visibility options include public
    //                         },
    //                         {
    //                             $and : [
    //                                 {
    //                                     userId : { $in : }
    //                                 }
    //                             ]
    //                         }
    //                     ]
    //                 }
    //             }
    //         ])
    //     }
    // }
    async getPosts(userId, limit = 10, cursor = null) {
        userId = new mongoose.Types.ObjectId(userId);
    
        // Step 1: Get user's friends
        const userFriendsDoc = await FriendsModel.findOne({ userId }).lean();
        if (!userFriendsDoc) throw new Error("Friends document not found.");
    
        const friendConditions = [];
    
        for (const friend of userFriendsDoc.friends) {
            friendConditions.push({
                userId: friend.friendId,
                visibility: { $in: ["public", "allFriends", friend.level] }
            });
        }
    
        const baseMatch = {
            $or: [
                { visibility: "public" },
                ...friendConditions
            ]
        };
    
        if (cursor) {
            baseMatch._id = { $lt: new mongoose.Types.ObjectId(cursor) };
        }
    
        const posts = await PostModel.aggregate([
            { $match: baseMatch },
            { $sort: { _id: -1 } },
            { $limit: limit },
            {
                $project: {
                    visibility: 0 // remove visibility from final result
                }
            }
        ]);
    
        return posts;
    }
    
}