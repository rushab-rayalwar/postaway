//core

//third-party
import mongoose from "mongoose";
import bcrypt from "bcrypt";

//custom
import {UserModel} from "./users.schema.js";
import { ApplicationError } from "../../middlewares/errorHandler.middleware.js"; 
import FriendsModel from "../friends/friends.schema.js";

export default class UsersRepository {
    constructor(){
        
    }
    async signUp(userData){
        try{
            userData.password = await bcrypt.hash(userData.password, 10); // hashes password before saving to the database
            let newUser = new UserModel(userData);
            let friendsList = new FriendsModel({
                userId : newUser._id
            });
            newUser.friendsList = new mongoose.Types.ObjectId(friendsList._id);
            await friendsList.save();
            await newUser.save();
            
            let data = {
                _id: newUser._id,
                email: newUser.email
            }
            return {success:true, data, statusCode:201, message:"User created successfully."}
        } catch(error) {
            if(error.name == "ValidationError"){
                let errorMessages = Object.values(error.errors).map(e=>e.message);
                return {success: false, errors:errorMessages, statusCode: 400}
            }
            if(error.name=="MongoServerError" || error.code == 11000){
                return {success: false, errors:["User account already exists"], statusCode:409}
            }   
            console.error("Error caught in the catch block - "+error);
            throw new ApplicationError(500,"Something went wrong!")
        }
    }
    async signIn(userData){
        try{
            let user = await UserModel.findOne({email:userData.email});
            if(!user){
                return {success: false, statusCode: 404, errors:["Invalid credentials."]}
            }
            let userAuthenticated = await bcrypt.compare(userData.password, user.password);
            if(!userAuthenticated){
                return {success: false, statusCode: 401, errors:["Invalid credentials."]}
            }
            let data = {
                _id: user._id,
                email: user.email,
                tokenVersion : user.tokenVersion
            }
            return {success:true, data, statusCode:200, message:"User logged in successfully."}
        } catch(error) {  
            console.error("Error caught in the catch block - "+error);
            throw new ApplicationError(500,"Could not login the user, something went wrong!");
        }
    }
    async logoutAllDevices(userId) {
        try{
            let user = await UserModel.findById(userId);
            user.tokenVersion += 1; // increment the token version to invalidate all previous tokens
            await user.save();
            return {success:true, message:"Logged out from all devices successfully.", data:null, statusCode:200}
        } catch(error){
            console.error("Error caught in the catch block - "+error);
            throw new ApplicationError(500,"Something went wrong!")
        }
    }
}