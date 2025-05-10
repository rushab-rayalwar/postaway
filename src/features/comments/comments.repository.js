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
        let session;
        try{

            session = await mongoose.startSession();
            session.startTransaction();

            // validate user
            userId = new mongoose.Types.ObjectId(userId);
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                throw new ApplicationError(500, "User ID sending the request not found in the DB");
            }

            //validate post ID
            if( !mongoose.Types.ObjectId(postId).isValid() ) {
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Invalid post ID"]}
            }
            postId = new mongoose.Types.ObjectId(postId);
            let post = await PostModel.findById(postId).lean().session(session);
            if(!post){
                await session.abortTransaction();
                return {success: false, statusCode: 404, errors:["Post not found"]} 
            }

            //get friendsList for post author
            let friendsListForAuthor = await FriendsModel.findOne({ userId : post.userId }).lean().session(session);
            if(!friendsListForAuthor){
                await session.abortTransaction();
                throw new ApplicationError(500,"FriendsList for a user whos post exists cannot be found"); // this is an internal server error as, the post exists, and the userId is valid, so the friends list should exist too
            }

            //get friendship level between the user sending the request and the post author
            let friendObjectInFriendsList = friendsListForAuthor.friends.find(f=>f.friendId.equals(userId));
            if(!friendObjectInFriendsList){

                // the user and post author not friends, check if the post is visible to everyone
                let accessible = post.visibility.includes("public");
                if(accessible){
                    let comments = await CommentModel.find({postId : postId});
                    await session.commitTransaction();
                    return {success: true, statusCode: 200, message:"Comments fetched successfully", data:comments}
                } else {
                    await session.abortTransaction();
                    return {success: false, statusCode: 404, message:"Post not found"} // to not expose the presence of the post to the user, we return a 404 error instead of 403
                }

            }
            let friendshipLevel = friendObjectInFriendsList.level;

            //check if the post and hence its comments are accessible to the user and then return
            let accessible = post.visibility.includes(friendshipLevel) || post.visibility.includes("public");
            if(accessible){
                let comments = await CommentModel.find({ postId : postId });
                await session.commitTransaction();
                return {success: true, statusCode: 200, message:"Comments fetched successfully", data:comments}
            } else {
                await session.abortTransaction();
                return {success: false, statusCode: 404, message:"Post not found"}
            }

        } catch(error) {

            console.log("Error caught in the getCommentsForPost -", error);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw error;

        } finally {

            if(session){
                await session.endSession();
            }

        }
    }
    async postComment(userId, postId, content){
        let session;
        try{
            
            //start transaction
            session = await mongoose.startSession();
            session.startTransaction();

            //validate user
            userId = new mongoose.Types.ObjectId(userId); // convert userId to ObjectId
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
            if( !mongoose.Types.ObjectId(postId).isValid() ) {
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Invalid post ID"]};
            }
            postId = new mongoose.Types.ObjectId(postId); // convert postId to ObjectId
            let post = await PostModel.findById(postId).session(session);
            if(!post){
                await session.abortTransaction();
                return {success: false, statusCode : 400, errors:["Invalid post ID or the post does not exist"]}
            }

            //create comment
            let newComment = new CommentModel({
                authorId : userId,
                authorName : userName,
                postId : postId,
                content : content
            });

            //save comment
            await newComment.save({session});

            //update and save post
            post.commentsCount ++;

            // post.recentComment = new mongoose.Types.ObjectId(newComment._id)
            await post.save(session);
            
            await session.commitTransaction();
            return {success:true, statusCode:201, message:"Comment posted successfully", data:newComment}

        } catch(error) {

            console.log("Error caught in postComment -", error);
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

    async updateComment(userId, commentId, updatedContent) {

        if(updatedContent === "" || !updatedContent){ // validate comment
            return {success:false, statusCode:400, errors:["Comment content cannot be empty"]};
        }

        let session;
        try{
            session = await mongoose.startSession();
            session.startTransaction();

            // validate userId and get user document
            userId = new mongoose.Types.ObjectId(userId); // convert userId to ObjectId
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                throw new ApplicationError(500, "User ID sending the request not found in the DB");
            }

            // validate commentId and get comment document
            if( !mongoose.Types.ObjectId(commentId).isValid() ) {
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Invalid comment ID"]};
            }
            commentId = new mongoose.Types.ObjectId(commentId); // convert commentId to ObjectId
            let comment = await CommentModel.findById(commentId).session(session);
            if(!comment){
                await session.abortTransaction();
                return {success:false, statusCode: 404, errors:["Comment not found."]}
            }

            //check if comment belongs to the user
            if(!comment.authorId.equals(userId)){
                await session.abortTransaction();
                return {success:false, statusCode:403, errors:["You are not authorized to modify this comment."]}
            }

            // update comment
            comment.content = updatedContent;
            comment.updated = true;
            await comment.save({session})

            await session.commitTransaction();
            return {success:true, statusCode:200, message:"Comment updated successfully", data:comment}

        } catch (error) {
            
            console.log("Error caught in updateComment -", error);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw error;

        }  finally {

            if(session){
                await session.endSession(); 
            }

        }
    }

    async deleteComment(userId, commentId) {
        let session;
        try {

            session = await mongoose.startSession();
            session.startTransaction();

            // validate userId
            userId = new mongoose.Types.ObjectId(userId);
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                throw new ApplicationError(500, "User ID sending the request not found in the DB");
            }

            // validate commentId
            if( !mongoose.Types.ObjectId(commentId).isValid() ) {
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Invalid comment ID"]};
            }
            commentId = new mongoose.Types.ObjectId(commentId);
            let comment = await CommentModel.findById(commentId).session(session);
            if(!comment){
                await session.abortTransaction();
                return {success:false, statusCode: 404, errors:["Comment not found."]}
            }

            // Check if the user is authorized to delete the comment.
            // The user must either own the comment or be the owner of the post on which the comment exists.
            let userIsAuthorizedToDelete = false;
            if(comment.authorId.equals(userId)){ // if the user is not the author of the comment
                userIsAuthorizedToDelete = true;
            } else {

                let postId = comment.postId;
                let post = await PostModel.findById(postId).session(session);
                if(!post){
                    await session.abortTransaction();
                    throw new ApplicationError(500,"Post for an existing comment could not be found"); // indicates data inconsistency, a serious issue as, the comment exists, but the post does not
                }
                if(post.userId.equals(userId)){ // if the user is not the author of the post
                    userIsAuthorizedToDelete = true;
                }

            }

            // delete comment
            if(!userIsAuthorizedToDelete){
                await session.abortTransaction();
                return {success:false, statusCode:403, errors:["You are not authorized to delete this comment."]};
            }
            await comment.deleteOne({session});

            // update post
            post.commentsCount --;
            if(post.commentsCount < 0){
                post.commentsCount = 0;
            }

            await post.save({session});
            await session.commitTransaction();
            return {success:true, statusCode:200, message:"Comment deleted successfully", data:comment}

        } catch(error) {

            console.log("Error caught in deleteComment -", error);
            if(session && session.inTransaction()){
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