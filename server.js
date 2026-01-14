//third-party
import express from "express";
import cors from "cors";

//custom
import { connectToMongoDB } from "./src/config/mongoose.config.js"

const server = express();
const port = process.env.PORT || 3000;

server.use(cors({                   // NOTE this
    origin:[process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials:true
}));

server.listen(port, '0.0.0.0', ()=>{
    console.log("Server is listening on port "+port);
    connectToMongoDB();
});

export default server;