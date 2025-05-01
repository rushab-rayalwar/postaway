// core

// libs
import express from "erxpress";

// custom
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";
import FeedController from "./feed.controller.js";

const feedRouter = express.Router();

const feedController = new FeedController();


//GET
feedRouter.get("/", jwtAuthenticator, (req,res,next)=>feedController.getPosts(req,res,next));
