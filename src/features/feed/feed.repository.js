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
    async getFeed(userId, limit = 20, cursor = new Date()) {
      try {
        // validate user
        let user = await UserModel.findById(userId);
        if(!user){
          return {success:false, errors:["User id requesting the feed is not registered"], statusCode:404}
        }

        // get user friends
        let friendsDocument = await FriendsModel.findOne({userId: userId});
        if(!friendsDocument){
          throw ApplicationError(500,"Friends List Document for an existing user could not found");
        }

        let friendsArray = friendsDocument.friends;

        let posts = []

        for(f of friendsArray){
          let friendsListForTheFriend = await FriendsModel.findOne({userId : f.friendId});
          let postsFromFriend
        }

      } catch(error) {

      }
    }
}