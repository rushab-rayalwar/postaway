//core

//third-party

//custom
import PostsRepository from "./posts.repository.js";

export default class PostsController {
    constructor(){
        this.postsRepository = new PostsRepository();
    }

    async getPostById(req, res, next) {
        let userId = req.user._id;
    }
    async createPost(req,res,next){
        const userId = req.user._id;
        const imagePublicId = req.image.imagePublicId;
        const imageUrl = req.image.secure_url;
        let response = await this.postsRepository.createPost(userId, imageUrl, imagePublicId);
    }
}