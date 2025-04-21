// core

// third-party
import multer from "multer";

// custom
import { ApplicationError } from "../middlewares/errorHandler.middleware.js";

const storage = multer.memoryStorage(); // Store files in memory before uploading to cloudinary

const fileFilter = (req,file,cb)=>{
    const allowedMimeTypes = ["image/jpg","image/png","image/jpeg","image/webp"];
    if(allowedMimeTypes.includes(file.mimetype)){
        cb(null, true);
    } else {
        cb(new ApplicationError("Only JPEG, PNG, and WEBP image files are allowed"), false);
    }
}

const sizeLimit = Number(process.env.MAX_SIZE);

export default multer(
    {
        storage, 
        fileFilter, 
        //limits : { fileSize : sizeLimit }
    });