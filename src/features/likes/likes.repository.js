// core

// libs
import mongoose from "mongoose";

// custom
import { UserModel } from "../users/users.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import { LikeModel } from "./likes.schema.js";
import { FriendsModel } from "../friends/friends.schema.js"
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";

export default class LikesRepository {
    constructor(){

    }
    async getLikesForPost(userId, postId){
        let session;
        try{

            //start session
            session = await mongoose.startSession();
            session.startTransaction();

            // validate userId
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId, userId is always a valid ObjectId as it is coming from the auth middleware
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {success:false, errors:["User id sending the request is invalid"], statusCode: 400};
            }

            // validate postId and get post visibility
            if( !mongoose.Types.ObjectId.isValid(postId) ){
                await session.abortTransaction();
                return {success:false, errors:["Post id is invalid"], statusCode: 400};
            }
            postId = new mongoose.Types.ObjectId(postId);
            let post = await PostModel.findById(postId).lean().session(session); // convert to ObjectId
            if(!post){
                await session.abortTransaction();
                return {success:false, errors:["Post could not be found"], statusCode: 400};
            }

            let postVisibility = post.visibility;
            let postIsAccessible = false; // tracks if the post is accessible to the user, the post is accessible if the user is the owner of the post, or if the post is public, or if the user is a friend of the post owner with friendship level included in the post visibility
            let likes = []; // if the post is not accessible, the likes will be empty, if the post is accessible, the likes will be populated with the users who liked the post

            // check if the post is public or if the user is the owner of the post
            if(postVisibility.includes("public") || post.userId.equals(userId)){

                postIsAccessible = true;

            } else {

                // check friendship;
                if(!userWhoPosted){
                    await session.abortTransaction();
                    throw new ApplicationError(500,"Inconsistent data - User for an existing post could not be found"); // every post must have an owner as a registered user, if the user deletes their account, the associated post must also be deleted
                }

                // get friends list for the post owner
                let userIdOfPostOwner = post.userId;
                let friendsListForPostOwner = await FriendsModel.findOne({userId : userIdOfPostOwner}).lean().session(session);
                if(!friendsListForPostOwner) {
                    await session.abortTransaction();
                    throw new ApplicationError(500, "Friends list could not be found for an existing user");
                }
                let friendObjectInFriendsListOfPostOwner = friendsListForPostOwner.friends.find(friend=>friend.friendId.equals(userId));
                if(!friendObjectInFriendsListOfPostOwner){ // the post owner and the user are not friends
                    await session.abortTransaction();
                    return {success: false, message: "Post could not be found", statusCode: 404}; // for security, the user should not be able to see the likes of a post they are not friends with
                }

                // check if the friendship level is included in the post visibility
                let friendshipLevel = friendObjectInFriendsListOfPostOwner.level;
                if(postVisibility.includes(friendshipLevel)){
                    postIsAccessible = true;
                } else {
                    await session.abortTransaction();
                    return {success: false, message: "Post could not be found", statusCode: 404};
                }
            }

            // get likes for the post
            if(postIsAccessible){
                likes = await LikeModel.aggregate([
                    {
                        $match : {
                            forPost : postId
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            localField : "byUser",
                            foreignField : "_id",
                            as : "likedBy"
                        }
                    },
                    {
                        $unwind : "$likedBy" // unwinding the array before replacing the root
                    },
                    {
                        $replaceRoot : {
                            newRoot : "$likedBy"
                        }
                    },
                    {
                        $project : {
                            name : 1,
                            _id : 1,
                            email : 1
                        }
                    }
                ]).session(session);
            }

            if(likes.length === 0){
                await session.commitTransaction();
                return {success: true, message:"No likes for the post yet", statusCode : 200, data: []}
            }

            await session.commitTransaction();
            return { success: true, message:"Likes for the post", statusCode : 200, data: likes }

        } catch(error){

            console.log("Caught in getLikesForPost", error);
            if(session && session.inTransaction()){
                await session.abortSession();
            }
            throw error;
 
        } finally {

            if(session){
                session.endSession();
            }

        }
    }

    async toggleLikeForPost(userId, postId){
        let session;
        try{
            session = await mongoose.startSession();
            session.startTransaction();

            // validate userId
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId
            let user = await UserModel.findById(userId).session(session);
            if(!user){
                return {success:false, errors:["User id sending the request is invalid"], statusCode: 400};
            }

            // validate postId
            if( !mongoose.Types.ObjectId.isValid(postId) ){
                return {success:false, errors:["Post id is invalid"], statusCode: 400};
            }
            postId = new mongoose.Types.ObjectId(postId); // convert to ObjectId
            let post = await PostModel.findById(postId).session(session);
            if(!post){
                return {success:false, errors:["Post could not be found"], statusCode: 400};
            }

            // check if the post is accessible to the user
            let postIsAccessible = false;
            let postVisibility = post.visibility;
            if(post.userId.equals(userId) || postVisibility.includes("public")){ // user is the owner of the post or the post is public
                postIsAccessible = true;
            } else {

                // check the friendship level between the user and the post woner and compare it with the post visibility

                // get post owner
                let userWhoPosted = await UserModel.findById(post.userId).lean().session(session);
                if(!userWhoPosted){
                    throw new ApplicationError(500,"Inconsistent data - User for an existing post could not be found"); // every post must have an owner as a registered user, if the user deletes their account, the associated post must also be deleted
                }

                // get friends list for the post owner
                let userIdOfPostOwner = new mongoose.Types.ObjectId(post.userId);
                let friendsListForPostOwner = await FriendsModel.findOne({userId : userIdOfPostOwner}).lean().session(session);
                if(!friendsListForPostOwner) {
                    throw new ApplicationError(500, "Friends list could not be found for an existing user");
                }

                // check if the user is a friend of the post owner
                let friendObjectInFriendsListOfPostOwner = friendsListForPostOwner.friends.find(friend=>friend.friendId.equals(userId));
                if(!friendObjectInFriendsListOfPostOwner){ // the post owner and the user are not friends
                    return {success: false, message: "Post could not be found", statusCode: 404}; // for security, the user should not be able to see the likes of a post they are not friends with
                }

                // check if the friendship level is included in the post visibility
                let friendshipLevel = friendObjectInFriendsListOfPostOwner.level;
                if(postVisibility.includes(friendshipLevel)){
                    postIsAccessible = true;
                } else {
                    return {success: false, message: "Post could not be found", statusCode: 404};
                }
            }

            if(postIsAccessible){
                // check if the user already liked the post
                let like = await LikeModel.findOne({forPost : postId, byUser : userId}).session(session);
                if(like){ // unlike the post
                    await LikeModel.deleteOne({forPost : postId, byUser : userId}).session(session);
                    post.likesCount -= 1;
                    await post.save({session});
                    return {success: true, message:"Post unliked", statusCode : 200};
                } else { // like the post
                    let newLike = new LikeModel({
                        forPost : postId,
                        byUser : userId
                    });
                    await newLike.save({session});
                    post.likesCount += 1;
                    await post.save({session});
                    return {success: true, message:"Post liked", statusCode : 200};
                }
            } else {
                return {success: false, message: "Post could not be found", statusCode: 404};
            }

        } catch(error){

            console.log("Caught in toggleLikeForPost", error);
            if(session){
                await session.abortTransaction();
            }
            throw error;

        } finally {

            if(session){
                await session.endSession();
            }
            
        }
    }
    
}
