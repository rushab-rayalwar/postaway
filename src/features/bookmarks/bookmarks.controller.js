
// custom


export default class BookmarksController {
    constructor(){
        this.bookmarksRepository = new BookmarksRepository;
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
}