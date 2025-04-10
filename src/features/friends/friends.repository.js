//core

//third-party
import mongoose from "mongoose";

//custom
import FriendsModel from "./friends.schema.js";

export default class FriendsRepository {
    constructor() {
    }

    async getAllFriends(userId, level) {
        if(level){
            let friendsDoc = await FriendsModel.findOne({userId: userId})
        }
    }
}