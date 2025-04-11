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
                    $unwind : "$friendsDetails" // because the $lookup operator returns an array even if the result is a single document
                },
                {
                    $replaceRoot : {
                        newRoot : "$friendsDetails"
                    }
                }
            ]);
            return {success: true, data: friendsDoc, statusCode: 200}
        } else {
            let friends = await FriendsModel.aggregate([
                {
                    $match : {
                        userId : mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $project : {
                        friends : 1
                    }
                }
            ]);
            return { success:true, data: friends, statusCode: 200}
        }
    }
    async getRequests(userId) {
        let requests = await FriendsModel.aggregate([
            {
                $match : {
                    userId : mongoose.Types.ObjectId(userId)
                }
            },
            {
                $project : {
                    requests : 1
                }
            },
            {
                $unwind : "$requests"
            },
            {
                $lookup : {
                    from : "users",
                    localField : "requests.from",
                    foreignField : "_id",
                    as: "requestFrom"
                }
            },
            {
                $unwind : "$requestFrom"
            },
            {
                $project :{
                    "requestFrom._id" : 1,
                    "requestFrom.name" : 1,
                    "requestFrom.email" : 1,
                    "requestFrom.sentOn" : "$requests.sentOn"
                }
            }
        ]);
        return {success:true, statusCode: 200, data: requests}
    }

}