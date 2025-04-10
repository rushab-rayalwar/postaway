//core

//third-party
import FriendsRepository from "./friends.repository";

//custom

export default class FriendsController {
    constructor() {
        this.friendsRepository = new FriendsRepository();
    }

    async getAllFriends(){
        let level = req.query.level;
        let userId = req.user._id;
        let friends = await this.friendsRepository.getAllFriends(userId, level);
    }
}