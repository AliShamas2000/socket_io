const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const registers = {};

app.use(express.json());

io.on("connection", (socket) => {
  socket.on("register", (identifier) => {
    registers[identifier] = socket.id;
  });

  socket.on("message", (data) => {
    const targetTo = data.to;
    const payload = data.payload; 
    if(registers[targetTo]){
        io.to(registers[targetTo]).emit('message' , payload);
    }
  });

  socket.on("disconnect", () => {
    for(const [userId , socketId] of Object.entries(registers)){
        if(socketId === socket.id){
            delete registers[userId];
        }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
