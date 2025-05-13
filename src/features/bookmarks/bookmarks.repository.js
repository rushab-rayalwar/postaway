// libs
import mongoose from "mongoose";

//custom
import { UserModel } from "../users/users.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import FriendsModel from "../friends/friends.schema.js";

export default class BookmarksRepository {
    constructor(){

    }

    async addBookmark(userId, postId){
        let session;
        try {
                session = new mongoose.startSession();
            session.startTransaction();   
            

                // validate userId
                userId = new mongoose.Types.ObjectId(userId); // convert to objectID, the userId is always of ObjectId data typoe as it is extracted from the token
                let user = await mongoose.findById(userId).lean().session(session);
                if(!user){
                    await session.abortTransaction();
                    return {success:false, errors:["User ID for adding the bookmark is not registered"], statusCode:404}
                }

                // validate postID
                if(!mongoose.Types.ObjectId.isValid(postId)){
                    await session.abortTransaction();
                    return {success:false, errors:["Post ID is invalid"], statusCode:400}
                }
                postId = new mongoose.Types.ObjectId(postId);
                let post = await PostModel.findById(postId).lean().session(session);
                if(!post){
                    return {success:false, errors:["Post does not exist"], statusCode:400}
                }

                // get the friend level for the user by the post owner
            //     const postOwnerId = post.userId;
            //     const friendShipObjectInPostOwnersFriendsList = await FriendsModel.aggregate([
            //         {
            //             $match : {
            //                 userId : postOwnerId
            //             }
            //         },
            //         {
            //             $project : {
            //                 friends : 1
            //             }
            //         },
            //         {
            //             $match : {
            //                 "friends.friendId" : userId
            //             }
            //         }
            //     ]).session(session); //  always returns an array 
            // if(friendShipObjectInPostOwnersFriendsList.length == 0){

            // }



        } catch(error){

            console.log("Error caught in addBookmark -", error);
            if(session && session.inTransaction() ){
                await startSession.abortTransaction();
            }
            throw error; // error is handled by the app level error handler 

        } finally {
            
            if(session){
                await session.endSession();
            }

        }
    }

}