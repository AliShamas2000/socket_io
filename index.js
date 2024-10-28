const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", // Replace with your specific origin for production
    methods: ["GET", "POST"],
  },
});

const registers = {};
let connectedClients = 0; // Variable to keep track of connected clients

app.use(express.json());

io.on("connection", (socket) => {
  connectedClients++;
  console.log(`New client connected: ${socket.id}`);
  console.log(`Total connected clients: ${connectedClients}`);

  socket.on("register", (identifier) => {
    registers[identifier] = socket.id;
    console.log(`User registered: ${identifier} with socket ID: ${socket.id}`);
  });

  socket.on("message", (data) => {
    const targetTo = data.to;
    const payload = data.payload;
    if (registers[targetTo]) {
      io.to(registers[targetTo]).emit("message", payload);
      console.log(`Message sent to ${targetTo}`);
    } else {
      console.log(`User with identifier ${targetTo} is not connected`);
    }
  });

  socket.on("disconnect", () => {
    connectedClients--;
    console.log(`Client disconnected: ${socket.id}`);
    console.log(`Total connected clients: ${connectedClients}`);

    for (const [userId, socketId] of Object.entries(registers)) {
      if (socketId === socket.id) {
        console.log(`User disconnected: ${userId}`);
        delete registers[userId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
