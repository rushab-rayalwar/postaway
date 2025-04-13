import mongoose from "mongoose";
import validator from "validator";

const usersSchema = new mongoose.Schema({
    name:{type:String, required:[true, "Name is required"]},
    email:{
        type:String,
        required:[true, "Email is required"],
        validate:[validator.isEmail, "Email is invalid"], // NOTE
        unique: true
    },
    password:{type:String, required:[true, "Password is required"], minLength:[5, "Password must be at least 5 characters long"]},
    
    tokenVersion : {
        type: Number,
        default: 0
    },
    friendList : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FriendsList"
        }
    ]
},{ collection : "users", timeStamps : true });

const UserModel = mongoose.model("User",usersSchema);

export { usersSchema, UserModel };