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

//PATCH
commentsRouter.patch("/:commentId", jwtAuthenticator, (req,res,next)=>commentsController.updateComment(req,res,next));

//DELETE
commentsRouter.delete("/:commentId", jwtAuthenticator, (req,res,next)=>commentsController.deleteComment(req,res,next));


export default commentsRouter;