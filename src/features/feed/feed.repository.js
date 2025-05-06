// core

// libs
import mongoose from "mongoose";

// custom
import { UserModel } from "../users/users.schema.js";
import { PostModel } from "../posts/posts.schema.js";
import FriendsModel from "../friends/friends.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js"

export default class FeedRepository{
    constructor(){

    }
    async getFeed(userId, limit, cursor = new Date(), filter){
      let session;
      userId = new mongoose.Types.ObjectId(userId);
      try{
        session = await mongoose.startSession();
        session.startTransaction();

        // validate user
        let user = await UserModel.findById(userId).lean().session(session);
        if(!user){
          await session.abortTransaction();
          return {success:false, errors:["User requesting the feed is not registererd"], statusCode : 404};
        }

        // get friends-list for the user
        let friendsListForUser = await FriendsModel.findOne({userId : userId}).lean().session(session);
        if(!friendsListForUser){
          await session.abortTransaction();
          throw new ApplicationError(500,"User's friends list could not be found");
        }
        let friendsArray = friendsListForUser.friends;

        let friendshipLevels = []; // an array fo objects containing the user id of the friend and the friendship level for the user by the friend

        // get friendship level for user by friends i.e. populate the friendshipLevels array
        for(let f of friendsArray){
          let friendsListForFriend = await FriendsModel.findOne({userId : f.friendId}).lean().session(session); // get the friends list for the friend
          if(!friendsListForFriend){
            await session.abortTransaction();
            throw new ApplicationError(500,"Friends list for an existing user could not be found"); // since the userid of the friend is present in the firends array of the user, the friend's account exists
          }
          
          let userObjectInTheFriendsArray = friendsListForFriend.friends.find(friendObject=>friendObject.friendId.equals(userId));
          if(!userObjectInTheFriendsArray){
            await session.abortTransaction();
            throw ApplicationError(500,"User's object is absent in friend's friends-list");
          }
          let friendshipLevel = userObjectInTheFriendsArray.level;

          let condition = {
            friendId : f.friendId,
            level : friendshipLevel
          }
          friendshipLevels.push(condition);
        }

        let postFetchConditions = friendshipLevels.map(fl=>{ // NOTE THIS
          return {
            userId : fl.friendId,
            visibility : { $in : ["allFriends", fl.level] }
          }
        });

        if (postFetchConditions.length === 0) {
          await session.commitTransaction();
          return {success: true, message: "No friends or valid friendship levels found", statusCode: 200, data: []};
        }

        let postsFromFriends = await PostModel.aggregate([
          {
            $match : {
              $and : [
                {
                  createdAt : {$lt : cursor}
                },
                {
                  $or : postFetchConditions
                }
              ]
            }
          },
          {
            $sort : {
              createdAt : -1
            }
          },
          {
            $limit : limit
          },
          {
            $project : {
              visibility : 0
            }
          }
        ]);

        await session.commitTransaction();
        
        if(postsFromFriends.length == 0){
          return {success:true, message:"No Posts to show", statusCode:200, data:[]}
        }

        return {success : true, message:"Posts retrived successfully", statusCode:200, data:postsFromFriends}

      } catch(error) {
        console.log("Error in getFeed: ", error);
        if(session && session.inTransaction()){
          await session.abortTransaction();
        }
        throw error;
      } finally {
        if(session){
          session.endSession();
        }
      }
    }
}