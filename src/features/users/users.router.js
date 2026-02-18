//third-party
import express from "express";

//custom
import UsersController from "./users.controller.js";
import { validateLogin, validateRegistration } from "../../middlewares/validator.js";
import jwtAuthenticator from "../../middlewares/jwtAuthenticator.js";

const usersRouter = express.Router();
const usersController = new UsersController();

//GET
usersRouter.get("/auth", jwtAuthenticator, (req,res,next)=> usersController.auth(req,res,next));
usersRouter.get("/", jwtAuthenticator, (req,res,next)=> usersController.getUsers(req,res,next));
//POST
usersRouter.post("/signup", validateRegistration, (req,res,next)=> usersController.signUp(req,res,next));
usersRouter.post("/signin", validateLogin, (req,res,next)=> usersController.signIn(req,res,next));
usersRouter.post("/logout", (req,res,next)=>{usersController.logout(req,res,next)});
usersRouter.post("/logout-all-devices", jwtAuthenticator, (req,res,next)=>{usersController.logoutAllDevices(req,res,next)});

export default usersRouter;