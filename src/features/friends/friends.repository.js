//core

//third-party
import mongoose from "mongoose";

//custom
import FriendsModel from "./friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";
import { UserModel } from "../users/users.schema.js";

export default class FriendsRepository {
    constructor() {
    }

    async getAllFriends(userId, level) {
        try{
            if(level){
                let friendsDoc = await FriendsModel.aggregate([
                    {
                        $match :  {
                            userId : new mongoose.Types.ObjectId(userId)
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
                            userId : new mongoose.Types.ObjectId(userId)
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
            console.error("Error caught in the catch block - "+err);
            throw new ApplicationError(500,"Something went wrong!")
        }
    }
    async getRequests(userId) {
        try{
            let requests = await FriendsModel.aggregate([
                {
                    $match : {
                        userId : new mongoose.Types.ObjectId(userId)
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
    async toggleFriendship(userId, friendId) {
        let session;
        try{
            session = await mongoose.startSession();
            session.startTransaction();
            let friend = await UserModel.findById(friendId).session(session);
            if(!friend){
                session.abortTransaction();
                return {success: false, errors:["Friend Id is invalid"], statusCode:400}
            }
            let friendsList = await FriendsModel.findOne({userId: userId}).session(session);
            if(!friendsList){
                session.abortTransaction();
                throw new ApplicationError(404, "Friends list not found for the user");
            }
            let friendIndex = friendsList.friends.findIndex(f=>f.friendId == friendId);
            if(friendIndex < 0){ // not a friend already, send a request
                let friendRequest = {
                    from : new mongoose.Types.ObjectId(userId), 
                    sentOn : Date.now()
                };
                let friendsListForFriend = await FriendsModel.findOne({userId : friendId}).session(session); // no need to check if it exists, as it is created when the user is created
                if(!friendsListForFriend){
                    throw new ApplicationError( 500, "Friends' list for friend does not exist" );
                }
                friendsListForFriend.requests.push(friendRequest); // add request to the friend's requests array
                await friendsListForFriend.save({session}); // save the friend's friends list

                return {success:true, statusCode: 200, message: "Friend request sent successfully", data:null};
            } else {
                // already a friend, remove friend
                friendsList.friends.splice(friendIndex, 1); // remove friend from the users friend-list
                let friendsListForFriend = await FriendsModel.findOne({userId : friendId}).session(session); // no need to check if it exists, as it is created when the user is created
                if(!friendsListForFriend){
                    throw new ApplicationError( 500, "Friends' list for friend does not exist" );
                }
                let indexOfUserInFriendsListForFriend = friendsListForFriend.friends.findIndex(f=>f.friendId == userId);
                if(indexOfUserInFriendsListForFriend < 0){
                    throw new ApplicationError(404, "Friend index not found in the friend's list");
                }
                friendsListForFriend.friends.splice(indexOfUserInFriendsListForFriend, 1); // remove user from the friend's friend-list
                await friendsList.save({session});
                await friendsListForFriend.save({session});
            }
        } catch(err){
            console.error("Error caught in the catch block - "+err);
            throw new ApplicationError(500,"Something went wrong!")
        }finally{
            if(session && session.inTransaction()){
                await session.abortTransaction();
                await session.endSession();
            }
        }
    }
    async respondToRequest(userId, friendId, action) { // Note: study mongoose transactions in this function
        let session;
        try{
            session = await mongoose.startSession();
            session.startTransaction();
            let friend = await UserModel.findById(friendId).session(session);
            if(!friend){
                await session.abortTransaction();
                // await session.endSession();
                return {success: false, errors:["Invalid user-Id or request does not exist"], statusCode:400};
            }
            let userFriendsList = await FriendsModel.findOne({userId : userId}).session(session);
            if(!userFriendsList){
                await session.abortTransaction();
                // await session.endSession();
                throw new ApplicationError(404, "Friends list not found for the user");
            }
            let friendRequestIndex = userFriendsList.requests.findIndex(r=>r.from.equals(friendId)); //Note: r.from is an ObjectId, so we need to use equals() method to compare it with friendId
            if(friendRequestIndex < 0){
                await session.abortTransaction();
                // await session.endSession();
                return {success: false, errors:["Invalid user-Id or request does not exist"], statusCode:400};
            }
            if(action == "accept"){
                let newFriendForUser = {
                    friendId : new mongoose.Types.ObjectId(friendId),
                    level : "general",
                    since : Date.now()
                };
                userFriendsList.friends.push(newFriendForUser); // add friend to the user's friend-list
                userFriendsList.requests.splice(friendRequestIndex, 1); // remove the request from the requests array
                let friendFriendsList = await FriendsModel.findOne({userId : friendId}).session(session);
                if(!friendFriendsList){
                    await session.abortTransaction();
                    // await session.endSession();
                    throw new ApplicationError(404, "Friends list not found for the friend");
                }
                let newFriendForFriend = {
                    friendId : new mongoose.Types.ObjectId(userId),
                    level : "general",
                    since : Date.now()
                };
                friendFriendsList.friends.push(newFriendForFriend); // add user to the friend's friend-list
                await userFriendsList.save({ session });
                await friendFriendsList.save({ session });
                await session.commitTransaction();
                // await session.endSession();
                return {success:true, statusCode: 200, message: "Friend request accepted successfully", data:null};
            } else if(action == "reject"){
                userFriendsList.requests.splice(friendRequestIndex, 1); // remove the request from the requests array
                await userFriendsList.save({ session });
                await session.commitTransaction();
                // await session.endSession();
                return {success:true, statusCode: 200, message: "Friend request rejected successfully", data:null};
            } else {
                await session.abortTransaction();
                // await session.endSession();
                return {success: false, errors:["Invalid action"], statusCode:400};
            }
        } catch(err){
            console.error("Error caught in the catch block - "+err);
            if(session && session.inTransaction()){
                // rollback the transaction if it is in progress
                await session.abortTransaction();
            }
            await session.abortTransaction();
            throw new ApplicationError(500,"Something went wrong!")
        } finally {
            if(session){
                await session.endSession();
            }
        }
    }
}