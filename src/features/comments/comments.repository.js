//core

//libs
import mongoose from "mongoose";

//local
import { CommentModel } from "./comments.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import { UserModel } from "../users/users.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";

export default class CommentsRepository {
    constructor(){

    }
    async postComment(userId, postId, content){
        try{
            //validate post id
            let post = await PostModel.findById(new mongoose.Types.ObjectId(postId)).lean();
            if(!post){
                return {success: false, statusCode : 400, errors:["Invalid post ID or the post does not exist"]}
            }

            //validate user
            let user = await UserModel.findById(userId).lean();
            if(!user){
                throw new ApplicationError(500, "User not found in the DB"); // this is an internal server error due to the fact that the userId extracted from the JWT was stored by the server and not finding a user for it implies serious issue - either the user was deleted unexpectedly, or, there's a flaw in the JWT signing/verification logic
            }
            let userName = user.name;

            //create comment
            let newComment = new CommentModel({
                authorId : new mongoose.Types.ObjectId(userId),
                authorName : userName,
                postId : new mongoose.Typesw.ObjectId(postId),
                content : content
            });
            await newComment.save();

            return {success:true, statusCode:201, message:"Comment posted successfully", data:newComment}
        } catch(error) {
            console.log("Error caught in the catch block -", error);
            if(error instanceof ApplicationError){
                throw error;
            }
            throw new Error(error);
        }
    }
}