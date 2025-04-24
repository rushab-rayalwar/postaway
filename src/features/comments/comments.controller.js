//core

//libs


//local
import ComentsRepository from "./comments.repository.js";

export default class CommentsController {
    constructor(){
        this.commentsRepository = new ComentsRepository();
    }

    async getCommentsForPost(req, res){
        let userId = req.user.userId;
        let postId = req.params.postId;
        let response = await this.commentsRepository.getCommentsForPost(postId, userId);
    }
    async postComment(req,res,next){
        const userId = req.user.userId;
        const postId = req.params.postId;
        const { content } = req.body;
        let response = await this.commentsRepository.postComment(userId, postId, content);
        if(response.success){
            return res.status(response.statusCode).json({success: true, message: response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success: false, errors: response.errors});
        }
    }
}
