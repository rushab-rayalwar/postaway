//third-party
import express from "express";

//custom
import { connectToMongoDB } from "./src/config/mongoose.config.js"

const server = express();
const port = process.env.PORT || 3000;

server.listen(port, ()=>{
    console.log("Server is listening on port "+port);
    connectToMongoDB();
});

export default server;