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
        let userId = req.user._id;
        let postContent = req.body.content;
        let response = await this.postsRepository.cretatePost(userId, postContent);
    }
}