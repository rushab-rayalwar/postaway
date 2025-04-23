//core

//libs


//local
import ComentsRepository from "./comments.repository.js";

export default class CommentsController {
    constructor(){
        this.commentsRepository = new ComentsRepository();
    }

    async getCommentsForPost(req, res){

    }
    async postComment(req,res,next){
        const userId = req.user.UserId;
        const {postId, content} = req.body;
        let response = await this.commentsRepository.postComment(userId, postId, content);
        if(response.success){
            return res.status(response.statusCode).json({success: true, message: response.message, data:response.data});
        }
    }
}
