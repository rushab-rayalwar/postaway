// core

//third-party
import mongoose from "mongoose";
import { UserModel } from "../users/users.schema";
import { ApplicationError } from "../../middlewares/errorHandler.middleware";

//custom


export default class PostsRepository {
    constructor() {
        
    }
    async createPost(userId, imageUrl, imagePublicId){
        try {
            let user = UserModel.findById(userId);
            if(!user){
                throw ApplicationError(500,"User Id is invalid for creating the post");
            }
        } catch(error) {

        }
    }
}