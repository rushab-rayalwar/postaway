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
    async getFeed(userId, limit, cursor = new Date(), filter){ // the filter feature is not implemented yet
      // let session;
      try{
        
        // session = await mongoose.startSession();
        // session.startTransaction();

        // validate user
        userId = new mongoose.Types.ObjectId(userId);
        // let user = await UserModel.findById(userId).lean().session(session);
        let user = await UserModel.findById(userId).lean();
        if(!user){
          await session.abortTransaction();
          return {success:false, errors:["User requesting the feed is not registererd"], statusCode : 404};
        }

        // validate limit -- now this is handled in the controller
        // if(limit <= 0){
        //   return {success:false, errors:["Limit parameter should be greater than 0"], statusCode:400}
        // }

        // get friends-list for the user
        // let friendsListForUser = await FriendsModel.findOne({userId : userId}).lean().session(session);
        let friendsListForUser = await FriendsModel.findOne({userId : userId}).lean();
        if(!friendsListForUser){
          await session.abortTransaction();
          throw new ApplicationError(500,"User's friends list could not be found");
        }
        let friendsArray = friendsListForUser.friends;

        let friendshipLevels = []; // an array fo objects containing the user id of the friend and the friendship level towards the user by the friend

        // get friendship level for user by friends i.e. populate the friendshipLevels array
        for(let f of friendsArray){
          let friendsListForFriend = await FriendsModel.findOne({userId : f.friendId}).lean().session(session); // get the friends list for the friend
          if(!friendsListForFriend){
            await session.abortTransaction();
            throw new ApplicationError(500,"Friends list for a friend of the user could not be found"); // since the userid of the friend is present in the firends array of the user, the friend's account exists
          }
          
          let userObjectInTheFriendsArray = friendsListForFriend.friends.find(friendObject=>friendObject.friendId.equals(userId)); // NOTE THIS : .equals method
          if(!userObjectInTheFriendsArray){
            await session.abortTransaction();
            throw new ApplicationError(500,"User's object is absent in friend's friends-list");
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

        let postsFromFriends = await PostModel.aggregate([
          {
            $match : {

              $and : [
                {
                  createdAt : {$lt : cursor}
                },
                {
                  $or : [
                    { userId : userId }, // matches posts that are owned by the user
                    ...(postFetchConditions ? postFetchConditions : []) // matches accessible posts by the user's friends NOTE THIS
                    ,
                    {
                      visibility : { $in: ["public"] } // matches public posts
                    }
                  ]
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
        // ]).session(session);
        ]);

        // await session.commitTransaction();
        
        if(postsFromFriends.length == 0){
          return {success:true, message:"No Posts to show", statusCode:200, data:[]}
        }

        // set nextCursor
        

        return {success : true, message:"Posts retrived successfully", statusCode:200, data:postsFromFriends}

      } catch(error) {

        console.log("Error in getFeed: ", error);
        // if(session && session.inTransaction()){
        //   await session.abortTransaction();
        // }
        throw error;

      } finally {

        // if(session){
        //   session.endSession();
        // }
        
      }
    }
}