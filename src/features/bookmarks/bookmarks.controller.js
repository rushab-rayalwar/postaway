
// custom
import BookmarksRepository from "./bookmarks.repository.js";

export default class BookmarksController {
    constructor(){
        this.bookmarksRepository = new BookmarksRepository();
    }

    async addBookmark(req,res,next){
        let userId = req.user.userId;
        let postId = req.params.postId;
        let response = await this.bookmarksRepository.addBookmark(userId, postId);
        if(response.success){
            return res.status(response.statusCode).json({success : response.success, message: response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success : response.success, errors:response.errors});
        }
    }

    async getBookmarks(req,res,next){
        let userId = req.user.userId;
        let limitQuery = parseInt(req.query.limit);
        let limit = Math.min( limitQuery || 2 , 10 );
        let cursor = req.query.cursor;
        let response = await this.bookmarksRepository.getBookmarks(userId, cursor, limit);
        if(response.success){
            return res.status(response.statusCode).json({success:response.success, message:response.message, data:response.data});
        } else {
            return res.status(response.statusCode).json({success:false, errors:response.errors})
        }
    }
}