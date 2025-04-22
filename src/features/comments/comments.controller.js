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
        let {userId, content, postId} = req.body;
        
    }
}
