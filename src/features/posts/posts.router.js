// core

// third-party
import express from "express";
import jwtAuthenticator from "../../middlewares/jwtAuthenticator";

// custom
import PostsController from "./posts.controller";

const postsRouter = express.Router();
const postsController = new PostsController();

//routes-get
postsRouter.get("/:postId", jwtAuthenticator, (req,res,next)=>postsController.getPostById(req,res,next));

//routes-post
postsRouter.post("/", jwtAuthenticator, (req,res,next)=>postsController.createPost(req,res,next));

export default postsRouter;