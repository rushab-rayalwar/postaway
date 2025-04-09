// third-party
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//custom
import {UserModel} from "../features/users/users.schema.js";


export default async function jwtAuthenticator(req, res, next) {
    let token = req.cookies.jwt;
    if(!token){
        return res.status(401).json({success:false, errors:["Access token required"]});
    }
    try {
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // attach the decoded token to the request object

        let user = await UserModel.findById(decoded.userId);
        if(!user){
            return res.status(401).json({success:false, errors:["Invalid or expired token"]});
        }
        let userTokenVersion = user.tokenVersion;

        if(userTokenVersion !== decoded.tokenVersion){ // check if the token version in the database matches the one in the token NOTE
            return res.status(401).json({success:false, errors:["Invalid or expired token"]});
        }

        next();
    } catch (error) {
        return res.status(401).json({success:false, errors:["Invalid or expired token"]});
    }
}