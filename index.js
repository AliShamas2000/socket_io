

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
        if (!registers[identifier]) {
            // If the identifier doesn't exist, create a new array
            registers[identifier] = [socket.id];
        } else {
            if (!registers[identifier].includes(socket.id)) {
                registers[identifier].push(socket.id); // Add socket.id if it doesn't exist
            }
            // If it exists, push the new socket ID into the existing array
        }

        console.log("Registersss" + JSON.stringify(registers));
    });

    socket.on("message", (data) => {
        const targetTo = data.identifier;
        newArray = [];
        if (registers['111']) {
            newArray = registers['111'].filter(socketId => socketId !== targetTo);
        }
        const payload = data.data;
        newArray.forEach(socketId => {
            console.log("TO " + socketId + "Message: " + "HERE");

            io.to(socketId).emit("message", payload);

        });
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

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
