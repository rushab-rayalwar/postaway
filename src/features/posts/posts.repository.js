// core

//third-party
import mongoose from "mongoose";
import { UserModel } from "../users/users.schema";
import { ApplicationError } from "../../middlewares/errorHandler.middleware";
import { PostModel } from "./posts.schema";

//custom


export default class PostsRepository {
    constructor() {
        
    }
    async createPost(userId, imageUrl, imagePublicId, content){
        try {
            let user = await UserModel.findById(userId);
            if(!user){
                throw ApplicationError(500,"User Id is invalid for creating the post"); // this would be an internal server error as, the userId is saved in and extracted from JWT by the server and the user cannot choose / modify the userId while sending request
            }
            let newPost = {
                userId : mongoose.Types.ObjectId(userId),
                content : content,
                image : {
                    publicId : imagePublicId,
                    url : imageUrl
                }
            };
            let newPostDoc = PostModel(newPost);
            await newPostDoc.save();
            return {success: true, statusCode: 201, message:"Post created successlly", data:newPost}
        } catch(error) {
            throw new ApplicationError(error.errorCode, error.errorMessage);
        }
    }
}