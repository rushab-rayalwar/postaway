//core

//third-party
import express from "express";

//custom
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";
import FriendsController from "./friends.controller.js";

const friendsController = new FriendsController();

const friendsRouter = express.Router();

//GET
friendsRouter.get("/all", jwtAuthenticator, (req,res,next)=>friendsController.getAllFriends(req,res,next)); // get all friends
friendsRouter.get("/requests", jwtAuthenticator, (req,res,next)=>friendsController.getRequests(req,res,next)); // get all requests
//PATCH
friendsRouter.patch("/toggle-friend/:friendId", jwtAuthenticator, (req,res,next)=>friendsController.toggleFriendship(req,res,next)); // toggle friendship
friendsRouter.patch("/requests/:friendId/:action", jwtAuthenticator, (req,res,next)=>friendsController.respondToRequest(req,res,next)); // respond to request
friendsRouter.patch("/update-level/:friendId", jwtAuthenticator, (req,res,next)=>friendsController.updateLevel(req,res,next)); // update level

export default friendsRouter;