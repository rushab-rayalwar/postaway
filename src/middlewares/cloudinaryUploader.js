// core

// third-party
import multer from "multer";
import streamifier from "streamifier";

// custom
import { cloudinary } from "../config/cloudinary.config.js";
 
export default async function uploadToCloudinary(req, res, next) {
    try {
        if(!req.file){
            return next();
        }
        let uploadPromise = new Promise(
        (resolve,reject)=>{
            const buffer = req.file.buffer;
            const cloudinaryStream = cloudinary.uploader.upload_stream(
                {
                    folder : `postaway/postImages/${req.user.userName}-${req.user.userId}`
                },
                (error, result)=>{
                    if(error) reject(error);
                    resolve(result);
                }
            );
            streamifier.createReadStream(buffer).pipe(cloudinaryStream);
        }
        );
        let result = await uploadPromise;
        req.image = {};
        req.image.secure_url = result.secure_url;
        req.image.public_id = result.public_id;
        next();
    } catch(error){
        console.log("Could not upload image to cloudinary...", error);
        next(error);
    }
}
