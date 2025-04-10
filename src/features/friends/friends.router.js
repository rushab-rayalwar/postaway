//core

//third-party
import express from "express";

//custom
import jwtAuthenticator from "../../middlewares/jwtAuthenticator";
import FriendsController from "./friends.controller";

const friendsController = new FriendsController();

const friendsRouter = express.Router();

friendsRouter.get("/all", jwtAuthenticator, (req,res,next)=>friendsController.getAllFriends(req,res,next));

export default friendsRouter;