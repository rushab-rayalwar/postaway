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

    
    async createPost(req,res,next){
        const userId = req.user.userId; console.log("UserId in controller", userId);

        const imagePublicId = req.image.public_id; //these are optional
        const imageUrl = req.image.secure_url;
        
        console.log("imagePublicId -", imagePublicId,", imageUrl -", imageUrl);

        const content = req.body.content;
        

        let response = await this.postsRepository.createPost(userId, imageUrl, imagePublicId, content);
        if(response.success){
            return res.status(response.statusCode).json({success:true, message:response.message, data:response.data});
        }
        throw new ApplicationError(500, "Could not create post");
    }
}