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
        try{
            // validate userId
            let user = await UserModel.findById(userId);
            if(!user){
                return {success: false, statusCode: 404, errors:["User sending the request is not registered"]};
            }

            // validate postId
            let post = await PostModel.findById(postId).lean();
            if(!post){
                return {success: false, statusCode: 404, errors:["Post not found"]}
            }
            let postVisibility = post.visibility;

            let data = null; // data to be returned

            // check if the post is accessible to the user 
            // - the post is accessible if its public or if the user is a friend of the user who posted it, with the frienship level included in the post visibility
            let userIdWhoPosted = post.userId;
            if( postVisibility.includes("public")) {
                data = {
                    ...post,
                    visibility : null // hide the visibility of the post
                }
            } else if(userIdWhoPosted.equals(new mongoose.Types.ObjectId(userId) )){

                data = post; // since the user is the owner, all info about the post is accessible

            } else { // check if the visibility of the post includes the friendship level of the user with the user who posted
                
                // check if the user is a friend of the user who posted
                let friendsListOfUserWhoPosted = await FriendsModel.findOne( { userId : new mongoose.Types.ObjectId(userIdWhoPosted) } ).lean();
                if(!friendsListOfUserWhoPosted){
                    throw new ApplicationError(500, "Data inconsistency: Expected friends list for existing user is missing.") // this is an internal server error because, it is expected that a friends list document to exist for every existing user, even when the list is empty
                }

                let friendObject = friendsListOfUserWhoPosted.friends.find((f)=>f.friendId.equals(new mongoose.Types.ObjectId(userId)));
                if(!friendObject){ // user is not a friend of the post owner
                    return {success:false, statusCode: 404, errors:["Post not found"]}  // although the post exists, it is not accessible to the user
                }

                // check and match friendship level
                let level = friendObject.level;
                if(postVisibility.includes(level) || postVisibility.includes("allFriends")) {
                    data = {
                        ...post,
                        visibility : null // hide the visibility of the post
                    }
                } else {
                    return {success:false, statusCode: 404, errors:["Post not found"]}
                }
            }

            return {success:true, statusCode:200, message:"Post retrieved successfully", data:data}
        } catch(error) {
            console.log("Error caught in the catch block -", error);
            throw error;
        }
    }

    async getAllUserPosts(userId, level){
        try {
            // validate userId
            let user = await UserModel.findById(userId).lean();
            if(!user){
                return {success: false, statusCode: 404, errors:["User sending the request is not registered"]};
            }

            let matchStage; // match stage in the aggregation pipeline

            if(level && level.trim() != ""){ // level is a query parameter as a string (which may or may not be provided by the user)
                // convert to array

                level = level.trim().replace(/\s+/g, " ").split(" ");
                for(let l of level){
                    if(!["public","allFriends", "general","close_friend","inner_circle"].includes(l)){
                        return {success:false, errors:["Invalid level parameter"], statusCode:400};
                    }
                }

                matchStage = {
                    userId : new mongoose.Types.ObjectId(userId),
                    visibility : { $in: level }
                }
            } else { // level is not provided by the user, fetch all posts
                matchStage = {
                    userId: new mongoose.Types.ObjectId(userId)
                }
            }

            //get user posts
            let posts = await PostModel.aggregate([
                {
                    $match : matchStage
                },
                {
                    $sort : {
                        createdAt : -1 // sort by createdAt in descending order
                    }
                },
                {
                    $project : {
                        visibility : 0,
                    }
                }
            ]);

            // check if posts exist

            if(!posts || posts.length === 0){
                return {success:true, statusCode:200, message:"No posts by the user yet", data:[]}
            }

            return {success:true, statusCode:200, message:"Posts retrived successfully", data:posts}
        } catch (error) {
            console.log("Error caught in the catch block -", error);
            throw error; // the error is handled by the global error handling middleware
        }
    }

    async createPost(userId, imageUrl, imagePublicId, content, visibility){ // transactions are not used here as, the post is created in a single collection and there are no other operations that need to be rolled back in case of failure. Also, the post creation is not dependent on any other operation.
        
        let vis = visibility || ["allFriends"]; // "visibility" is a space-separated string provided via query param.
                                            // If not provided, default to ["everyone"]. Convert to array and validate.
        const validVisibilityOptions = ["public","allFriends", "general","close_friend","inner_circle"];

        if(vis != "allFriends") { // the user has provided the visibility options
            vis = vis.trim().split(" ");
            for(let option of vis){
                if(!validVisibilityOptions.includes(option)){
                    return {success: false, statusCode: 400, errors:["Visibility options are invalid"]}
                }
            }
        }

        let session;

        try {
            session = await mongoose.startSession();
            session.startTransaction();

            // validate userId
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {success: false, statusCode: 404, errors:["User sending the request is not registered"]};
            }
            let userName = user.name;

            // validate content
            if(!content || content.trim() === ""){
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Post content is required"]};
            }
            if(content.length > 500){
                await session.abortTransaction();
                return {success: false, statusCode: 400, errors:["Post content cannot exceed 500 characters"]};
            }

            // make new post object and update the database
            let newPost;
            if(imageUrl && imagePublicId) { // image is provided
                newPost = {
                    userId : new mongoose.Types.ObjectId(userId),
                    userName: userName,
                    content : content,
                    image : {
                        publicId : imagePublicId,
                        url : imageUrl
                    },
                    visibility : vis
                };
            } else { // image is not provided
                newPost = {
                    userId : new mongoose.Types.ObjectId(userId),
                    userName,
                    content : content,
                    visibility : vis
                }
            }
            let newPostDoc = new PostModel(newPost);
            await newPostDoc.save({session});

            await session.commitTransaction();
            
            return {success: true, statusCode: 201, message:"Post created successlly", data:newPostDoc}
        } catch(err) {
            console.log("Error caught in catch block -", err);
            
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            
            if(err.name == "ValidationError"){
                let errorsArray = Object.values(err.errors).map(e=>e.message); // NOTE this
                return {
                    success:false, errors:errorsArray, statusCode : 400
                }
            } else {
                throw err;
            }
        } finally {
            if(session){
                await session.endSession();
            }
        }
    }

    async getPostsForAUser(userIdOfRequestingUser, userIdToBeViewed){
        try{
            // validate user ID of requesting user
            let userRequesting = await UserModel.findById(userIdOfRequestingUser).lean();
            if(!userRequesting){
                return {success: false, statusCode: 404, errors:["User sending the request is not registered"]};
            }

            // validate user ID of the user who's posts are to be fetched
            let postOwner = await UserModel.findById(userIdToBeViewed).lean();
            if(!postOwner){
                return {success: false, statusCode: 404, errors:["User id whose posts are to be viewed is invalid"]};
            }

            // get friendship status between the users
            let friendsListForTheUserToBeViewed = await FriendsModel.findOne({ userId : new mongoose.Types.ObjectId(userIdToBeViewed) }).lean();
            if(!friendsListForTheUserToBeViewed){
                throw new ApplicationError(500,"Friends Object for an existing user could not be found");
            }

            let friendShipObjectForTheTwoUsersInTheList = friendsListForTheUserToBeViewed.friends.find(friend => friend.friendId.equals(new mongoose.Types.ObjectId(userIdOfRequestingUser)));
            
            let isFriend = !!friendShipObjectForTheTwoUsersInTheList;

            let posts; // posts to be returned
            if(!isFriend){
                posts = await PostModel.aggregate([
                    {
                        $match : {
                            userId : new mongoose.Types.ObjectId(userIdToBeViewed),
                            visibility : "public"
                        }
                    },
                    {
                        $project : {
                            visibility : 0, //  hide the visibility options for the post
                        }
                    },
                    {
                        $sort : {
                            createdAt : -1 // sort by createdAt in descending order
                        }
                    }
                ]);
            } else {
                let friendshipLevel = friendShipObjectForTheTwoUsersInTheList.level;
                posts = await PostModel.aggregate([
                    {
                        $match : {
                            userId : new mongoose.Types.ObjectId(userIdToBeViewed),
                            visibility : {
                                $in : ["allFriends", friendshipLevel, "public"]
                            }
                        }
                    },
                    {
                        $project : {
                            visibility : 0
                        }
                    },
                    {
                        $sort : {
                            createdAt : -1 // sort by createdAt in descending order
                        }
                    }
                ]);
            }

            return {success:true, statusCode:200, message:"Posts for the user fetched successfully", data:posts}
        } catch(error) {
            console.log("Error caught in the catch block -", error);
            throw error;
        }
    }

    async updatePostVisibility(userId, postId, newVisibilityOptions){
        let session;
        userId = new mongoose.Types.ObjectId(userId);
        postId = new mongoose.Types.ObjectId(postId);
        try{
            session = await mongoose.startSession();
            session.startTransaction();

            //validate user
            const user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {success: false, statusCode: 404, errors:["User sending the request is not registered"]};
            }

            //validate post
            let post = await PostModel.findById(postId).session(session);
            if(!post){
                await session.abortTransaction();
                return {success: false, statusCode: 404, errors:["Post does not exist"]};
            }

            // validate new visibility options
            if( !newVisibilityOptions || newVisibilityOptions.trim() === "" ){
                await session.abortTransaction();
                return {success:false, statusCode:400, errors:["Visibility options are not provided"]}
            }
            const  validVisibilityOptions = ["public","allFriends", "general","close_friend","inner_circle"];
            newVisibilityOptions = newVisibilityOptions.trim().replace(/\s+/g," ").split(" ");
            for(let option of newVisibilityOptions){
                if(!validVisibilityOptions.includes(option)){
                    return {success:false, errors:[`Visibility option '${option}' is invalid`], statusCode:400}
                }
            }

            post.visibility = newVisibilityOptions;

            await post.save({session});

            await session.commitTransaction();
            return{success:true, message:"Visibility options updated successfully", statusCode:200, data:post}
        } catch(error){
            console.log("Error caught in 'updatePostVisibility' -", error);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw error;
        } finally{
            if(session){
                await session.endSession();
            }
        }
    }
}