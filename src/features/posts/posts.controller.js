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
        let response = await this.postsRepository.getPostById(userId, postId);
    }
    async getAllUserPosts(req,res,next){
        let userId = req.user.userId;
        let level = req.query.level
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
        const visibility = req.query.visibility;

        if(!visibility || visibility == ""){
            visibility = null;
        }

        let response = await this.postsRepository.createPost(userId, imageUrl, imagePublicId, content, visibility);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        } else if(!response.success) {
            return res.status(response.statusCode).json({success:false, errors:response.errors})
        }
        throw new ApplicationError(500, "Could not create post");
    }
}