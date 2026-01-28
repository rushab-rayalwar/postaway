//core

//third-party
import mongoose from "mongoose";

//custom
import {FriendsModel} from "./friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js";
import { UserModel } from "../users/users.schema.js";

export default class FriendsRepository {
    constructor() {
    }

    async getAllFriends(userId, level) {
        let session;
        try{
            //start session
            session = new mongoose.startSession();
            session.startTransaction();

            // check if the userId is valid
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId
            let user = await UserModel.findById(userId);
            if(!user){
                await session.abortTransaction();
                return {success: false, errors:["User id sending the request is not registered"], statusCode: 400}
            }

            // check if the friends list exists for the user
            let friendsList = await FriendsModel.findOne({userId: userId});
            if(!friendsList){
                await session.abortTransaction();
                throw new ApplicationError(500,"Friend list list for an existing user could not be found");
            }

            // get friends for the user
            if(level){
                let friendsDoc = await FriendsModel.aggregate([
                    {
                        $match :  {
                            userId : userId
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
                    },
                    {
                        $project : {
                            password : 0,
                            tokenVersion : 0,
                            friendsList : 0
                        }
                    }
                ]).session(session);

                if(friendsDoc.length == 0){
                    await session.commitTransaction();
                    return {success: true, data: [], statusCode: 200, message: "No friends found with the specified level"}
                }

                await session.commitTransaction();
                return {success: true, data: friendsDoc, statusCode: 200, message: "Friends fetched successfully"}

            } else {

                let friends = await FriendsModel.aggregate([
                    {
                        $match : {
                            userId : userId
                        }
                    },
                    {
                        $project : {
                            friends : 1
                        }
                    }
                ]).session(session);
                if(friends.length == 0){
                    await session.commitTransaction();
                    return {success: true, data: [], statusCode: 200, message: "No friends found"}
                }

                await session.commitTransaction();
                return { success:true, data: friends, statusCode: 200}
            }

        } catch(error){

            console.error("Error caught in the catch block - "+err);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw error;

        } finally {

            if(session){
                await session.endTransaction();
            }

        }
    }

    async getRequests(userId) {
        let session;
        try{
            session = new mongoose.startSession();
            await session.startTransaction();

            // check if the userId is valid
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {success: false, errors:["User id sending the request is invalid"], statusCode: 400};
            }

            // check if the friends list exists for the user
            let friendsList = await FriendsModel.findOne({userId: userId}).lean().session(session);
            if(!friendsList){
                await session.abortTransaction();
                throw new ApplicationError(500,"Friend list for an existing user could not be found");
            }

            // get requests for the user
            let requests = await FriendsModel.aggregate([
                {
                    $match : {
                        userId : userId
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
            ]).session(session);

            if(requests.length == 0){
                await session.commitTransaction();
                return {success:true, statusCode200, data: [], message: "No friends yet"}
            }
            await session.commitTransaction();
            return {success:true, statusCode: 200, data: requests, message:"Friends fetched successfully"};

        } catch(error){

            console.error("Error caught in getRequests - "+error);
            if(session&&session.inTransaction()){
                await session.abortTransaction();
            }
            throw error;

        } finally {

            if(session){
                await session.endSession();
            }

        }
    }

    async toggleFriendship(userId, friendId) {//  this function is used to send a friend request or remove a friend
        let session;
        try{
            session = await mongoose.startSession();
            session.startTransaction();

            // check if the userId is valid
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                session.abortTransaction();
                return {success: false, errors:["User Id sending the request is invalid"], statusCode:400}
            }

            // check if the friendId is valid
            if(!mongoose.Types.ObjectId.isValid(friendId)){
                await session.abortTransaction();
                return {success: false, errors:["Friend Id is invalid"], statusCode:400}
            }
            if( userId.equals(friendId) ){
                await session.abortTransaction();
                return {success: false, errors:["User Id and friend Id are same"], statusCode:400}
            }
            friendId = new mongoose.Types.ObjectId(friendId); // convert to ObjectId
            let friend = await UserModel.findById(friendId).lean().session(session);
            if(!friend){
                await session.abortTransaction();
                return {success: false, errors:["User Id for sending friend request to / removing as a friend is invalid"], statusCode:400}
            }

            // get friends' list for the user
            let friendsList = await FriendsModel.findOne({userId: userId}).session(session);
            if(!friendsList){
                await session.abortTransaction();
                throw new ApplicationError(500, "Friends list not found for an existing user");
            }

            // check if the friendId is already in the friends list -- check if the user is already a friend, if yes, remove the friend
            let friendIndex = friendsList.friends.findIndex(f=>f.friendId.equals(friendId));
            if(friendIndex < 0){ // not a friend already, send a request
                let friendRequest = {
                    from : userId, 
                    sentOn : Date.now()
                };

                // get friends' document for the user to whom the request is being sent and add the request to the requests array
                let friendsListForFriend = await FriendsModel.findOne({userId : friendId}).session(session);
                if(!friendsListForFriend){
                    await session.abortTransaction();
                    throw new ApplicationError( 500, "Friends' list for an existing user could not be found" );
                }
                friendsListForFriend.requests.push(friendRequest); // add request to the friend's requests array
                await friendsListForFriend.save({session}); // save the friend's friends list

                await session.commitTransaction();
                return {success:true, statusCode: 200, message: "Friend request sent successfully", data:null};

            } else {

                // already a friend, remove friend
                friendsList.friends.splice(friendIndex, 1); // remove friend from the users friend-list

                // get friends' document for the friend and remove the user from the friend's friend-list
                let friendsListForFriend = await FriendsModel.findOne({userId : friendId}).session(session);
                if(!friendsListForFriend){
                    await session.abortTransaction();
                    throw new ApplicationError( 500, "Friends' list for an existing user could not be found" );
                }

                // get the index of userId is in the friend's friend-list
                let indexOfUserInFriendsListForFriend = friendsListForFriend.friends.findIndex( f=>f.friendId.equals(userId) );
                if(indexOfUserInFriendsListForFriend < 0){
                    await session.abortTransaction();
                    throw new ApplicationError(500, "User Id of user not found in the friend's friend-list, but the friendId is present in the user's friend-list");
                }

                // remove the user from the friend's friend-list
                friendsListForFriend.friends.splice(indexOfUserInFriendsListForFriend, 1);

                await friendsList.save({session});
                await friendsListForFriend.save({session});
                await session.commitTransaction();
                return {success:true, statusCode: 200, message: "Friend removed successfully", data:null};
            }

        } catch(err){

            console.error("Error caught in toggleFriendship - "+err);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw err;

        }finally{

            if(session){
                await session.endSession();
            }

        }
    }

    async respondToRequest(userId, friendId, action) {
        let session;
        try{
            session = await mongoose.startSession();
            session.startTransaction();

            // check if the userId is valid
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {success: false, errors:["User id sending the request is invalid"], statusCode:400};
            }

            // check if the friendId is valid
            if(!mongoose.Types.ObjectId.isValid(friendId)){
                await session.abortTransaction();
                return {success: false, errors:["Friend id is invalid"], statusCode:400};
            }
            if( userId.equals(friendId) ){
                await session.abortTransaction();
                return {success: false, errors:["User id and friend id are same"], statusCode:400};
            }
            friendId = new mongoose.Types.ObjectId(friendId); // convert to ObjectId
            let friend = await UserModel.findById(friendId).session(session);
            if(!friend){
                await session.abortTransaction();
                return {success: false, errors:["Invalid user-Id for friend"], statusCode:400};
            }

            // get friends' list for the user
            let userFriendsList = await FriendsModel.findOne({userId : userId}).session(session);
            if(!userFriendsList){
                await session.abortTransaction();
                throw new ApplicationError(500, "Friends list not found for the user");
            }

            // check if the friendId is in the requests array
            let friendRequestIndex = userFriendsList.requests.findIndex(r=>r.from.equals(friendId));
            if(friendRequestIndex < 0){
                await session.abortTransaction();
                return {success: false, errors:["Request does not exist"], statusCode:400};
            }

            // depending on the action, either accept or reject the request
            if(action == "accept"){
                let newFriendForUser = {
                    friendId : friendId,
                    level : "general",
                    since : Date.now()
                };
                userFriendsList.friends.push(newFriendForUser); // add friend to the user's friend-list
                userFriendsList.requests.splice(friendRequestIndex, 1); // remove the request from the requests array
                
                // get friends' document for the friend and add the user to the friend's friend-list
                let friendFriendsList = await FriendsModel.findOne({userId : friendId}).session(session);
                if(!friendFriendsList){
                    await session.abortTransaction();
                    throw new ApplicationError(500, "Friends list not found for the friend");
                }
                let newFriendForFriend = {
                    friendId : userId,
                    level : "general",
                    since : Date.now()
                };
                friendFriendsList.friends.push(newFriendForFriend); // add user to the friend's friend-list
                
                await userFriendsList.save({ session });
                await friendFriendsList.save({ session });
                await session.commitTransaction();
                return {success:true, statusCode: 200, message: "Friend request accepted successfully", data:null};

            } else if(action == "reject"){

                userFriendsList.requests.splice(friendRequestIndex, 1); // remove the request from the requests array
                
                await userFriendsList.save({ session });
                await session.commitTransaction();
                return {success:true, statusCode: 200, message: "Friend request rejected successfully", data:null};
                
            } else {
                
                await session.abortTransaction();
                return {success: false, errors:["Invalid action"], statusCode:400};
            }

        } catch(err){

            console.error("Error caught in respondToRequest - "+err);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw err;

        } finally {

            if(session){
                await session.endSession();
            }

        }
    }

    async updateLevel(userId, friendId, newLevel){
        let session;
        try{
            session = mongoose.startSession();
            session.startTransaction();

            // validate the userId
            userId = new mongoose.Types.ObjectId(userId); // convert to ObjectId
            let user = await UserModel.findById(userId).lean().session(session);
            if(!user){
                await session.abortTransaction();
                return {succes:false, errors:["User id sending the request is invalid"], statusCode :400}
            }

            // validate friend id
            if(!mongoose.Types.ObjectId.isValid(friendId)){
                await session.abortTransaction();
                return {succes:false, errors:["Friend id is invalid"], statusCode: 400}
            }
            if( userId.equals(friendId) ){
                await session.abortTransaction();
                return {succes:false, errors:["User id and friend id are same"], statusCode: 400}
            }
            friendId = new mongoose.Types.ObjectId(friendId); // convert to ObjectId
            let friend = await UserModel.findById(friendId).lean().session(session);
            if(!friend){
                await session.abortTransaction();
                return {succes:false, errors:["Friend id is invalid"], statusCode: 400}
            }

            // get friends list for the user
            let friendsListForUser = await FriendsModel.findOne({userId: userId}).session(session);
            if(!friendsListForUser){
                await session.abortTransaction();
                throw new ApplicationError(500, "Friends list not found for an existing user");
            }

            // check if the friendId is in the friends list of the user -- check if friends already
            let friendsAlready = true;
            let friendIndexInFriendsListForUser = friendsListForUser.friends.findIndex(f=>f.friendId.equals(friendId));
            if(friendIndexInFriendsListForUser < 0){
                friendsAlready = false;
            }

            // get friends list for the friend
            let friendsListForFriend = await FriendsModel.findOne({userId: friendId}).lean().session(session);
            if(!friendsListForFriend){
                await session.abortTransaction();
                throw new ApplicationError(500, "Friends list not found for an existing user");
            }
            
            // check if the userId is in the friends list for the friend
            let userIndexInFriendsListForFriend = friendsListForFriend.friends.findIndex(f=>f.friendId.equals(userId));
            if(userIndexInFriendsListForFriend < 0){
                if(friendsAlready){
                    await session.abortTransaction();
                    throw new ApplicationError(500,"Inconsistent data: User is not in the friend's friend-list, but the friend is in the user's friend-list");
                }
                await session.abortTransaction();
                return {success: false, errors:["The user does not initially hold any level of friendship with the specified userId"], statusCode: 400}
            }

            // check if the new level is valid
            if(!["general","close_friend","inner_circle"].includes(newLevel)){
                await session.abortTransaction();
                return {success: false, errors:["Invalid friend level "], statusCode: 400}
            }

            // update the level
            friendsListForUser.friends[friendIndexInFriendsListForUser].level = newLevel; // only update the level in the user's friend-list as, the friend level for the same friendship can be different for both users

            await friendsListForUser.save({session});
            await session.commitTransaction();

            return {success:true, statusCode: 200, message: "Friend level updated successfully", data:null};

        } catch(err){

            console.error("Error caught in updateLevel - "+err);
            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            throw err;

        } finally {

            if(session){
                await session.endSession();
            }

        }
    }
}