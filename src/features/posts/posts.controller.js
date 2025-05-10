//core

//third-party

//custom
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";
import PostsRepository from "./posts.repository.js";

export default class PostsController {
    constructor(){
        this.postsRepository = new PostsRepository();
    }

    async getPostById(req, res, next) {
        let userId = req.user.userId;
        let postId = req.params.postId;
        let response = await this.postsRepository.getPostById(userId, postId);
        if(response.success){
            return res.status(response.statusCode).json({success: true, message:response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success: false, errors: response.errors});
        }
    }
    async getAllUserPosts(req,res,next){
        let userId = req.user.userId;
        let level = req.query.level || null;
        let response = await this.postsRepository.getAllUserPosts(userId, level);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        } else if(!response.success) {
            return res.status(response.statusCode).json({success:false, errors:response.errors})
        }
    }
    
    async createPost(req,res,next){
        const userId = req.user.userId;

        const imagePublicId = req.image.public_id; //these are optional
        const imageUrl = req.image.secure_url;

        const content = req.body.content;
        let visibility = req.query.visibility;

        if(!visibility || visibility == ""){
            visibility = null;
        }

        let response = await this.postsRepository.createPost(userId, imageUrl, imagePublicId, content, visibility);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        } else if(!response.success) {
            return res.status(response.statusCode).json({success:false, errors:response.errors})
        }
    }
    
    async getPostsForUser(req,res,next){
        let userIdOfRequestingUser = req.user.userId;
        let userIdOfPostsOwner = req.params.userIdOfPostsOwner;

        if(userIdOfRequestingUser == userIdOfPostsOwner){ // if the user is requesting their own posts, redirect to the getAllUserPosts endpoint
            return res.redirect("/api/posts/");
        }

        let response = await this.postsRepository.getPostsForAUser(userIdOfRequestingUser, userIdOfPostsOwner);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors})
        }
    }

    async updatePostVisibility(req,res,next){
        let userId = req.user.userId;
        let postId = req.params.postId;
        let newVisibilityOptions = req.params.options;
        let response = await this.postsRepository.updatePostVisibility(userId,postId,newVisibilityOptions);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors})
        }
    }
}