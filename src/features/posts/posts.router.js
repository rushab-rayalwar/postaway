// core

// third-party
import express from "express";
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";
import saveImageToMemory from "../../config/multer.config.js";
import uploadToCloudinary from "../../middlewares/cloudinaryUploader.js";
import upload from "../../config/multer.config.js";

// custom
import PostsController from "./posts.controller.js";

const postsRouter = express.Router();
const postsController = new PostsController();

//GET
postsRouter.get("/", jwtAuthenticator, (req,res,next)=>postsController.getAllUserPosts(req,res,next)); //get posts for the user sending the request
postsRouter.get("/:postId", jwtAuthenticator, (req,res,next)=>postsController.getPostById(req,res,next)); // get a particular post
postsRouter.get("/userPosts/:userId", jwtAuthenticator, (req,res,next)=>postsController.getPostsForUser(req,res,next)); // get posts for a user

//POST
postsRouter.post("/", jwtAuthenticator, upload.single("image"), uploadToCloudinary, (req,res,next)=>postsController.createPost(req,res,next)); // create new post

//PATCH
postsRouter.patch("/updateVisibility/:postId/:options",jwtAuthenticator,(req,res,next)=>postsController.updatePostVisibility(req,res,next)); // update the vibility options for a user's post
export default postsRouter;