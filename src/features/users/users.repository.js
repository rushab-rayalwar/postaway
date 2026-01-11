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
        let session;
        try{

            //start transaction
            session = await mongoose.startSession();
            session.startTransaction(0);

            userData.password = await bcrypt.hash(userData.password, 10); // password hashing   

            //make friends document for the new user
            let newUser = new UserModel(userData);
            let friendsList = new FriendsModel({
                userId : newUser._id
            });
            newUser.friendsList = new mongoose.Types.ObjectId(friendsList._id);

            await friendsList.save({session});
            await newUser.save({session});
            await session.commitTransaction();

            let data = {
                _id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }
            return {success:true, data, statusCode:201, message:"User created successfully."}
            
        } catch(error) {

            if(session && session.inTransaction()){
                await session.abortTransaction();
            }
            if(error.name == "ValidationError"){
                let errorMessages = Object.values(error.errors).map(e=>e.message); // Object.values converts keys of an object into an array
                return {success: false, errors:errorMessages, statusCode: 400}
            }
            if(error.name=="MongooseError" || error.code == 11000 || error.keyPattern && error.keyPattern.email){
                return {success: false, errors:["User account already exists for the email id"], statusCode:409}
            }   
            console.error("Error caught in singnUp - "+error);
            throw new ApplicationError(500,"Something went wrong")

        } finally {

            if( session ){
                await session.endSession();
            }

        }
    }

    async signIn(userData){
        try{

            // validate user account exists for the email
            let user = await UserModel.findOne({email:userData.email});
            if(!user){
                return {success: false, statusCode: 404, errors:["Invalid credentials."]}
            }

            // validate password
            let userAuthenticated = await bcrypt.compare(userData.password, user.password);
            if(!userAuthenticated){
                return {success: false, statusCode: 401, errors:["Invalid credentials."]}
            }

            // data to be returned
            let data = {
                _id: user._id,
                email: user.email,
                name: user.name,
                tokenVersion : user.tokenVersion
            }
            return {success:true, data, statusCode:200, message:"User logged in successfully."}

        } catch(error) { 

            console.error("Error caught in signIn - "+error);
            throw new ApplicationError(500,"Could not login the user, something went wrong!");

        }
    }

    async logoutAllDevices(userId) {
        try{

            // validate user
            let user = await UserModel.findById(userId);
            if(!user){
                return {success:false, errors:["User sending the request not registered"], statusCode:404}
            }

            user.tokenVersion += 1; // increment the token version to invalidate all previous tokens
            await user.save();
            return {success:true, message:"Logged out from all devices successfully.", data:null, statusCode:200}

        } catch(error){

            console.error("Error caught in logoutAllDevices - "+error);
            throw new ApplicationError(500,"Something went wrong!")

        }
    }
}