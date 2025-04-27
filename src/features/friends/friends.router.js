//core

//third-party
import express from "express";

//custom
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";
import FriendsController from "./friends.controller.js";

const friendsController = new FriendsController();

const friendsRouter = express.Router();

//GET
friendsRouter.get("/all", jwtAuthenticator, (req,res,next)=>friendsController.getAllFriends(req,res,next));
friendsRouter.get("/requests", jwtAuthenticator, (req,res,next)=>friendsController.getRequests(req,res,next));
//PATCH
friendsRouter.patch("/toggle-friend/:friendId", jwtAuthenticator, (req,res,next)=>friendsController.toggleFriendship(req,res,next));
friendsRouter.patch("/requests/:friendId/:action", jwtAuthenticator, (req,res,next)=>friendsController.respondToRequest(req,res,next));
friendsRouter.patch("/update-level/:friendId", jwtAuthenticator, (req,res,next)=>friendsController,updateLevel(req,res,next));

export default friendsRouter;