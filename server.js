const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "https://renderdeployy.onrender.com/",
        method: ["GET", "POST"]
    }
})


//create connection through socket
io.on("connection", (socket)=>{
    socket.emit("me", socket.id)


    //to disconnect from socket
    socket.on("disconnect", ()=>{
        socket.broadcast.emit("callEnded")
    })


    //want ability to call the user by id
    socket.on("callUser", (data)=>{
        io.to(data.userToCall).emit("callUser", {
            //things that are from our frontend
            signal: data.signalData,
            from: data.from,
            name: data.name
            })
    })

    //answering of the call
    socket.on("answerCall", (data)=>
        io.to(data.to).emit("callAccepted"), data.signal
    )


})




server.listen(5000, ()=> console.log("petunia is watching you"));