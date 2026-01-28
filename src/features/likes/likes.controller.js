// core

// libs

// custom
import LikesRepository from "./likes.repository.js"

export default class LikesController {
    constructor(){
        this.likesRepository = new LikesRepository();
    }

    async getLikesForAPost(req,res,next){
        let userId = req.user.userId;
        let postId = req.params.postId;
        let response = await this.likesRepository.getLikesForPost(userId,postId);
        if(response.success){
            return res.status(response.statusCode).json({ success : true, message : response.message, data : response.data });
        } else {
            return res.status(response.statusCode).json({ success : false, message : response.message });
        }
    }
    async toggleLike(req,res,next){
        let userId = req.user.userId;
        let postId = req.params.postId;
        let response = await this.likesRepository.toggleLikeForPost(userId, postId);
        if(response.success){
            return res.status(response.statusCode).json({ success : true, message : response.message, data : response.data });
        } else {
            return res.status(response.statusCode).json({ success : false, message : response.message });
        }
    }
}