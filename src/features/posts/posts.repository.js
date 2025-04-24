// core

//third-party
import mongoose from "mongoose";

//custom
import { UserModel } from "../users/users.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";
import { PostModel } from "./posts.schema.js";
import FriendsModel from "../friends/friends.schema.js";


export default class PostsRepository {
    constructor() {
        
    }

    async getPostById(userId, postId){
        let user = await UserModel.findById(userId);
        if(!user){
            throw ApplicationError(500,"User Id is invalid for accessing the post"); // this is an internal server error as, the userId is saved in and extracted from JWT by the server and the user cannot choose / modify the userId while sending request
        }
        let post = await PostModel.findById(postId);
        if(!post){
            return {success: false, statusCode: 404, errors:["Post not found"]}
        }
        let userIdWhoPosted = post.userId;
        let friendsListOfUserWhoPosted = await FriendsModel.findOne( { userId : new mongoose.Types.ObjectId(userIdWhoPosted) } );
        if(!friendsListOfUserWhoPosted){
            throw new ApplicationError(500, "Something went wrong, friends list for an existing user cannot be found") // this is an internal server error because, it is expected that a friends list document to exist for every existing user, even when the list is empty
        }
        let friendObjectForUserWhoPosted = friendsListOfUserWhoPosted.friends.find((f)=>f.friendId.equals(new mongoose.Types.ObjectId(userId)));
        if(!friendObjectForUserWhoPosted){ // user requesting the post is not a friend of the user who posted
            
            if(post.visibility.includes("all")){
                return {success: true, statusCode: 200, data: post, message: "Post fetched successfully"} // NOTE this
            }
        }
        let friendLevel = friendObjectForUserWhoPosted.level;
        if(post.visibility.includes(friendLevel)){
            let data = {
                
            }
            return {success: true, statsuCode: 200, data, message: "Post fetched successfully"}
        }
    }

    async getAllUserPosts(userId){
        try {
            // validate userId
            let user = await UserModel.findById(userId).lean();
            if(!user){
                    throw new ApplicationError(500,"User Id is invalid for accessing the post"); // this is an internal server error as, the userId is saved in and extracted from JWT by the server and the user cannot choose / modify the userId while sending request
                }

            //get user posts
            let posts = await PostModel.aggregate([
                {
                    $match : {
                        userId : new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $sort : {
                        createdAt : -1
                    }
                }
            ]);
            if(posts.length === 0){
                return {success:true, statusCode:200, message:"No posts by the user yet", data:[]}
            }
            const data = posts.map(p=>{
                return {
                    ...p,
                    likes : p.likes.length || 0,
                    comments : p.comments.length || 0
                }
            });
            return {success:true, statusCode:200, message:"Posts retrived successfully", data:data}
        } catch (error) {
            console.log("Error caught in the catch block -", error);
            throw error; // the error is handled by the global error handling middleware
        }
    }

    async createPost(userId, imageUrl, imagePublicId, content, visibility){
        
        
        let vis = visibility || ["everyone"]; // "visibility" is a space-separated string provided via query param.
                                            // If not provided, default to ["everyone"]. Convert to array and validate.
        const validVisibilityOptions = ["everyone", "general","close_friend","inner_circle"];
        if(!Array.isArray(vis)) {
            vis = vis.trim().split(" ");
            for(let option of vis){
                if(!validVisibilityOptions.includes(option)){
                    return {success: false, statusCode: 400, errors:["Visibility options are invalid"]}
                }
            }
        }

        try {
            let user = await UserModel.findById(userId);
            if(!user){
                throw new ApplicationError(500,"User Id is invalid for creating the post"); // this would be an internal server error as, the userId is saved in and extracted from JWT by the server and the user cannot choose / modify the userId while sending request
            }
            let newPost;
            if(imageUrl && imagePublicId) {
                newPost = {
                    userId : new mongoose.Types.ObjectId(userId),
                    content : content,
                    image : {
                        publicId : imagePublicId,
                        url : imageUrl
                    },
                    visibility : vis
                };
            } else {
                newPost = {
                    userId : new mongoose.Types.ObjectId(userId),
                    content : content,
                    visibility : vis
                }
            }
            let newPostDoc = new PostModel(newPost);
            await newPostDoc.save();
            return {success: true, statusCode: 201, message:"Post created successlly", data:newPostDoc}
        } catch(err) {
            console.log("Error caught in catch block -", err);
            if(err.name == "ValidationError"){
                let errorsArray = Object.values(err.errors).map(e=>e.message); // NOTE this
                return {
                    success:false, errors:errorsArray, statusCode : 400
                }
            } else if(err instanceof ApplicationError){
                throw new ApplicationError(err.errorCode, err.errorMessage);
            } else {
                throw new ApplicationError(500, "Something went wrong while creating a post");
            }
        }
    }
}