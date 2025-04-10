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
            let friendsDoc = await FriendsModel.aggregate([
                {
                    $match :  {
                        userId : mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $unwind : "$friends"
                },
                {
                    $match : {
                        "friends.level" : level
                    }
                },
                {
                    $lookup : {
                        from : "users",
                        localField : "friends.friendId",
                        foreignField : "_id",
                        as : "friendsDetails"
                    }
                },
                {
                    $unwind : "$friendsDetails"
                },
                {
                    $replaceRoot : {
                        newRoot : "$friendsDetails"
                    }
                }
            ]);

        }
    }
}