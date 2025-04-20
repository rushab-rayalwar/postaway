// core

// third-party
import express from "express";
import jwtAuthenticator from "../../middlewares/jwtAuthenticator";
import saveImageToMemory from "../../config/multer.config";
import uploadToCloudinary from "../../middlewares/cloudinaryUploader";
import upload from "../../config/multer.config";

// custom
import PostsController from "./posts.controller";

const postsRouter = express.Router();
const postsController = new PostsController();

//GET
postsRouter.get("/:postId", jwtAuthenticator, (req,res,next)=>postsController.getPostById(req,res,next));

//POST
postsRouter.post("/", jwtAuthenticator, upload.single("image"), uploadToCloudinary, (req,res,next)=>postsController.createPost(req,res,next));

export default postsRouter;