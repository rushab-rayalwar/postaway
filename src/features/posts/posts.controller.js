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
        let userId = req.user._id;
        let response = await this.postsRepository.getPostById(userId, postId);
    }
    async createPost(req,res,next){
        const userId = req.user._id;

        const imagePublicId = req.image.imagePublicId; //these are optional
        const imageUrl = req.image.secure_url;
        
        const content = req.body.content;
        

        let response = await this.postsRepository.createPost(userId, imageUrl, imagePublicId, content);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        }
        throw new ApplicationError(500, "Could not create post");
    }
}