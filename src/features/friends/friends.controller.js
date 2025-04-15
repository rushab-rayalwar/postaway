//core

//third-party
import FriendsRepository from "./friends.repository";

//custom

export default class FriendsController {
    constructor() {
        this.friendsRepository = new FriendsRepository();
    }

    async getAllFriends(req,res,next){
        let level = req.query.level;
        let userId = req.user._id;
        let response = await this.friendsRepository.getAllFriends(userId, level);
        if(response.success){
            return res.status(response.statusCode).json({
                success: response.success,
                data: response.data
            });
        } else {
            return res.status(response.statusCode).json({
                success: response.success,
                errors: [response.message]
            });
        }
    }
    async getRequests(req,res,next){
        let userId = req.user._id;
        let response = await this.friendsRepository.getRequests(userId);
        if(response.success){
            return res.status(response.statusCode).json({
                success: response.success,
                data: response.data
            });
        } else {
            return res.status(response.statusCode).json({
                success: response.success,
                errors: [response.errors]
            });
        }
    }
    async toggleFriendship(req,res,next){
        let userId = req.user._id;
        let friendId = req.params.friendId;
        let response = await this.friendsRepository.toggleFriendship(userId, friendId);
    }
    async respondToRequest(req,res,next){
        let userId = req.user._id;
        let friendId = req.params.friendId;
        let action = req.params.action;
        let response = await this.friendsRepository.respondToFriend(userId, friendId, action);
    }
}