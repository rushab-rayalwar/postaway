//core

//third-party
import express from "express";

//custom
import jwtAuthenticator from "../../middlewares/jwtAuthenticator";
import FriendsController from "./friends.controller";

const friendsController = new FriendsController();

const friendsRouter = express.Router();

friendsRouter.get("/all", jwtAuthenticator, (req,res,next)=>friendsController.getAllFriends(req,res,next));
friendsRouter.get("/requests", jwtAuthenticator, (req,res,next)=>friendsController.getRequests(req,res,next));

export default friendsRouter;