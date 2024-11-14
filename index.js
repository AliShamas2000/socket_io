const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*", // Replace with specific origin for production
        methods: ["GET", "POST"],
    },
});


const registers = {}; // Store user identifiers and their socket IDs
let connectedClients = 0; // Track connected clients

app.use(express.json());

io.on("connection", (socket) => {
    connectedClients++;
    console.log(`New client connected: ${socket.id}`);
    console.log(`Total connected clients: ${connectedClients}`);

    socket.on("register", (identifier) => {
        // Initialize array if identifier doesn't exist
        registers[identifier] = registers[identifier] || [];
        
        // Avoid duplicate entries for the same socket ID
        if (!registers[identifier].includes(socket.id)) {
            registers[identifier].push(socket.id);
        }

        console.log("Registers: " + JSON.stringify(registers));
    });

    socket.on("message", (data) => {
        const targetTo = data.identifier;
        const payload = data.data;

        // Ensure the identifier exists in registers before filtering
        if (registers[targetTo]) {
            const targetSockets = registers[targetTo].filter(socketId => socketId !== socket.id);
            targetSockets.forEach(socketId => {
                console.log(`Sending message to ${socketId}`);
                io.to(socketId).emit("message", payload);
            });
        }
    });

    socket.on("disconnect", () => {
        connectedClients--;
        console.log(`Client disconnected: ${socket.id}`);
        console.log(`Total connected clients: ${connectedClients}`);

        // Loop through registers to remove the disconnected socket ID
        for (const identifier in registers) {
            registers[identifier] = registers[identifier].filter(socketId => socketId !== socket.id);
            if (registers[identifier].length === 0) {
                delete registers[identifier]; // Clean up empty arrays
            }
        }

        console.log("Updated Registers after disconnect: " + JSON.stringify(registers));
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
