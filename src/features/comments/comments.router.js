// core

// libs
import express from "express";

// local
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";
import CommentsController from "./comments.controller.js";

const commentsRouter = express.Router();
const commentsController = new CommentsController();

//GET
commentsRouter.get("/:postId", jwtAuthenticator, (req,res,next)=>commentsController.getCommentsForPost(req,res,next));

//POST
commentsRouter.post("/:postId", jwtAuthenticator, (req,res,next)=>commentsController.postComment(req,res,next));


export default commentsRouter;