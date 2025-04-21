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
postsRouter.get("/:postId", jwtAuthenticator, (req,res,next)=>postsController.getPostById(req,res,next));

//POST
postsRouter.post("/", jwtAuthenticator, upload.single("image"), uploadToCloudinary, (req,res,next)=>postsController.createPost(req,res,next));

export default postsRouter;