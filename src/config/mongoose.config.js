import mongoose from "mongoose";
const url = process.env.MONGO_URL;
export function connectToMongoDB(){
    mongoose.connect(url).then(()=>{
        console.log("Connected to mongoDB");
    }).catch((err)=>{
        console.log("Something went wrong, could not connect to MongoDB.");
        console.error(err);
    });
}