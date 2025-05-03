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
        userId = new mongoose.Types.ObjectId(userId);
      
        // 1. Get all your friends
        const friendsDoc = await FriendsModel.findOne({ userId }).lean();
        if (!friendsDoc) return [];
      
        const friendIds = friendsDoc.friends.map(f => f.friendId);
      
        // 2. For each friend, get how they classify you
        const friendFriendDocs = await FriendsModel.find({
          userId: { $in: friendIds },
          "friends.friendId": userId
        }, { userId: 1, friends: 1 }).lean();
      
        // 3. Build a map: friendId => level they gave to YOU
        const visibilityMap = {};
        for (const doc of friendFriendDocs) {
          const friendEntry = doc.friends.find(f => f.friendId.toString() === userId.toString());
          if (friendEntry) {
            visibilityMap[doc.userId.toString()] = friendEntry.level;
          }
        }
      
        // 4. Get posts from those friends, where post.visibility includes:
        // - 'public'
        // - 'allFriends'
        // - or the level this friend gave you
        const posts = await PostModel.find({
          userId: { $in: friendIds },
          createdAt: { $lt: cursor },
          $expr: {
            $function: {
              body: function(visibility, userId, visibilityMap) {
                const uid = userId.toString();
                const allowed = visibilityMap[uid];
                return visibility.includes("public") || 
                       visibility.includes("allFriends") ||
                       (allowed && visibility.includes(allowed));
              },
              args: ["$visibility", "$userId", visibilityMap],
              lang: "js"
            }
          }
        }).sort({ createdAt: -1 }).limit(limit).lean();
      
        return posts;
    }
}