// libs
import mongoose from "mongoose";

//custom
import { UserModel } from "../users/users.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import FriendsModel from "../friends/friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";
import { BookmarkModel } from "./bookmarks.schema.js";

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
                    await session.abortTransaction();
                    return {success:false, errors:["Post does not exist"], statusCode:400}
                }

                // check if the post is accessible to the user
                let accessible = false;
                if(post.visibility.includes("public")){

                    accessible = true;

                } else {

                    // check if user is a friend of the post owner with the friend level assigned to the user present in the post's visibility array
                    const postOwnerId = post.userId;
                    const friendsListForPostOwner = await FriendsModel.findOne({userId:postOwnerId}).lean().session(session);
                    if(!friendsListForPostOwner){
                        await session.abortTransaction();
                        throw new ApplicationError(500,"Friends List for post owner not found"); // Inconsistent data : Every existing user must have a friends list document
                    }
                    const userObjectInFriendsArrayOfPostOwner = friendsListForPostOwner.friends.find(()=>friendId.equals(userId));
                    if(userObjectInFriendsArrayOfPostOwner){

                        const friendLevel = userObjectInFriendsArrayOfPostOwner.level;
                        if(post.visibility.includes(friendLevel)){
                            accessible = true;
                        } else {
                            accessible = false;
                        }

                    } else {
                        accessible = false;
                    }
                }

                if(!accessible){
                    await session.abortTransaction();
                    return {success:false, statusCode: 404, errors:"Post not found"} // the post exists but the existence must not be notified to the user as the post is inaccessible
                }

                // post is accessible
                let newBookmark = await BookmarkModel({
                    userId: userId,
                    postId: postId
                })
                await newBookmark.save();
                await session.commitTransaction();
                return {success:true, data:newBookmark, statusCode:200};


                
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
            //     return {}
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

    async getBookmarks(userId, cursor = new Date(), limit){
        let session;
        try{
            session = mongoose.startSession();
            session.startTransaction();

            //validate userId
            userId = new mongoose.Types.ObjectId(userId); // convert to objectID, the userId is always of ObjectId data typoe as it is extracted from the token
            let user = await UserModle.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {success:false, errors:["User ID for adding the bookmark is not registered"], statusCode:404}
            }

            // get bookmarks
            // let bookmarks = await BookmarkModel.find({userId:userId}).lean().session(session);
            // if(!bookmarks || bookmarks.length == 0){
            //     await session.commitTransaction();
            //     return {success:true, message:"No bookmarks found", statusCode:200}
            // }
            let bookmarks = await BookmarkModel.aggregate([
                {
                    $match : {
                        userId : userId,
                        createdAt : {
                            $lt : cursor
                        }
                    }
                },
                {
                    $sort : {
                        createdAt : -1
                    }
                },
                {
                    $limit : limit
                }
            ]).session(session);

            if(bookmarks.length == 0){
                return {success:true, message:"No posts bookmarked by the user", statusCode: 200, data:[]}
            }

            // get posts
            let postIds = bookmarks.map((bookmark)=>bookmark.postId);
            let posts = await PostModel.find({_id:{$in:postIds}}).lean().session(session);
            if(!posts || posts.length == 0){
                await session.commitTransaction();
                throw new ApplicationError(500,"Post object not found for bookmarks"); // Inconsistent data : The bookmarks must have a post object
            }

            // check if the posts are accessible to the user
            let accessiblePosts = [];
            for(let i=0; i<posts.length; i++){
                let post = posts[i];
                let accessible = false;
                if(post.visibility.includes("public")){
                    accessible = true;
                } else {
                    const postOwnerId = post.userId;
                    const friendsListForPostOwner = await FriendsModel.findOne({userId:postOwnerId}).lean().session(session);
                    if(!friendsListForPostOwner){
                        await session.abortTransaction();
                        throw new ApplicationError(500,"Friends List for post owner not found"); // Inconsistent data : Every existing user must have a friends list document
                    }
                    const userObjectInFriendsArrayOfPostOwner = friendsListForPostOwner.friends.find((f)=>f.friendId.equals(userId));
                    if(userObjectInFriendsArrayOfPostOwner){
                        const friendLevel = userObjectInFriendsArrayOfPostOwner.level;
                        if(post.visibility.includes(friendLevel)){
                            accessible = true;
                        } else {
                            accessible = false;
                        }
                    } else {
                        accessible = false;
                    }
                }

                if(accessible){
                    accessiblePosts.push(post);
                }
            }

            await session.commitTransaction();
            if(accessiblePosts.length == 0){
                return {success:true, message:"No bookmarks found", statusCode:200, data:[]}
            }

            // set nextCursor
            const nextCursor = accessiblePosts[accessiblePosts.length - 1];
            return {success:true, data:{accessiblePosts, nextCursor}, statusCode:200, message:"Posts fetched"};

        } catch(error){

            console.log("Error caught in getBookmarks -", error);
            if(session && session.inTransaction() ){
                await session.abortTransaction();
            }
            throw error; // error is handled by the app level error handler 

        } finally {
            
            if(session){
                await session.endSession();
            }

        }
    }

}