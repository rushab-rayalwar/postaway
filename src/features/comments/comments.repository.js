//core

//libs
import mongoose from "mongoose";

//local
import { CommentModel } from "./comments.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import { UserModel } from "../users/users.schema.js";
import FriendsModel from "../friends/friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";

export default class CommentsRepository {
    constructor(){

    }
    async getCommentsForPost(postId, userId) {
        try{
            // validate user
            let user = await UserModel.findById(userId).lean();
            if(!user){
                throw new ApplicationError(500, "User ID sending the request not found in the DB");
            }

            //validate post ID
            let post = await PostModel.findById(postId).lean();
            if(!post){
                return {success: false, statusCode: 400, errors:["Invalid Post ID"]} 
            }

            //get friendsList for post author
            let friendsListForAuthor = await FriendsModel.findOne({ userId : new mongoose.Types.ObjectId(post.userId._id) }).lean();
            if(!friendsListForAuthor){
                throw new ApplicationError(500,"FriendsList for a user whos post exists cannot be found"); // this is an internal server error as, the post exists, and the userId is valid, so the friends list should exist too
            }

            //get friendship level between the user sending the request and the post author
            let friendObjectInFriendsList = friendsListForAuthor.friends.find(f=>f.friendId.equals(new mongoose.Types.ObjectId(userId)));
            if(!friendObjectInFriendsList){
                // the user and post author not friends, check if the post is visible to everyone
                let accessible = post.visibility.includes("everyone");
                if(accessible){
                    let comments = await CommentModel.find({postId : new mongoose.Types.ObjectId(postId)});
                    return {success: true, statusCode: 200, message:"Comments fetched successfully", data:comments}
                }
            }
            let friendshipLevel = friendObjectInFriendsList.level;

            //check if the post and hence its comments are accessible to the user and then return
            let accessible = post.visibility.includes(friendshipLevel) || post.visibility.includes("everyone");
            let comments = await CommentModel.find({postId : new mongoose.Types.ObjectId(postId)});
            return {success: true, statusCode: 200, message:"Comments fetched successfully", data:comments}
        } catch(error) {
            console.log("Error caught in the catch block -", error);
            if(error instanceof ApplicationError) {
                throw error;
            }
            throw Error(error);
        }
    }
    async postComment(userId, postId, content){
        let session;
        try{
            //start transaction
            session = await mongoose.startSession();
            session.startTransaction();

            //validate user
            let user = await UserModel.findById(userId).session(session).lean(); // when not implementing transactions, the session parameter is not needed
            if(!user){
                await session.abortTransaction();
                throw new ApplicationError(500, "User not found in the DB"); // this is an internal server error due to the fact that the userId extracted from the JWT was stored by the server and not finding a user for it implies serious issue - either the user was deleted unexpectedly, or, there's a flaw in the JWT signing/verification logic
            }
            let userName = user.name;

            //validate comment
            if(content === "" || !content){
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Comment content cannot be empty"]};
            }

            //validate post id and update the comments count
            let post = await PostModel.findById(postId).session(session);
            if(!post){
                await session.abortTransaction();
                return {success: false, statusCode : 400, errors:["Invalid post ID or the post does not exist"]}
            }

            //create comment
            let newComment = new CommentModel({
                authorId : new mongoose.Types.ObjectId(userId),
                authorName : userName,
                postId : new mongoose.Types.ObjectId(postId),
                content : content
            });

            //save comment
            await newComment.save({session});

            //update and save post
            post.commentsCount ++;
            post.recentComment = new mongoose.Types.ObjectId(newComment._id)
            await post.save(session);
            
            await session.commitTransaction();
            return {success:true, statusCode:201, message:"Comment posted successfully", data:newComment}
        } catch(error) {
            console.log("Error caught in the catch block -", error);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw error; // handle the error in the global error handler middleware
        } finally {
            if(session){
                await session.endSession();
            }
        }
    }
}