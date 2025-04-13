//core

//third-party
import mongoose from "mongoose";

//custom
import FriendsModel from "./friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";

export default class FriendsRepository {
    constructor() {
    }

    async getAllFriends(userId, level) {
        try{
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
        } catch(err){
            console.error("Error caught in the catch block - "+error);
            throw new ApplicationError(500,"Something went wrong!")
        }
    }
    async getRequests(userId) {
        try{
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
            if(requests.length == 0){
                return {success:true, statusCode200, data: [], message: "No friends yet"}
            }
            return {success:true, statusCode: 200, data: requests, message:"Friends fetched successfully"};
        } catch(err){
            console.error("Error caught in the catch block - "+error);
            throw new ApplicationError(500,"Something went wrong!")
        }
    }
    async toggleFriend(userId, friendId){
        try{
            let friendsList = FriendsModel.findOne({ userId: userId });
            if(!friendsList){
                return {success:false, errors:["Friends list not found"], statusCode:404}
            }
            let alreadyAFriend = friendsList.friends.some(f=>f.friendId == friendId);
            if(alreadyAFriend){
                
            }
        }catch(err){

        }
    }
}