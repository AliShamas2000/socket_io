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

const registers = {}; // Store user identifiers and their socket IDs
let connectedClients = 0; // Track connected clients

app.use(express.json());

io.on("connection", (socket) => {
  connectedClients++;
  console.log(`New client connected: ${socket.id}`);
  console.log(`Total connected clients: ${connectedClients}`);

  socket.on("register", (identifiers) => {
    identifiers = Array.isArray(identifiers) ? identifiers : [identifiers];

    identifiers.forEach((identifier) => {
      registers[identifier] = registers[identifier] || [];

      // Kormel ma yseer fe duplicate  socket ID
      if (!registers[identifier].includes(socket.id)) {
        registers[identifier].push(socket.id);
      }
    });

    console.log("Registers: " + JSON.stringify(registers));
  });

  socket.on("message", (data) => {
    const targetTo = data.identifier;
    const payload = data.data;

    // Ensure the identifier exists in registers before filtering
    if (registers[targetTo]) {
      const targetSockets = registers[targetTo].filter(
        (socketId) => socketId !== socket.id
      );
      targetSockets.forEach((socketId) => {
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
      registers[identifier] = registers[identifier].filter(
        (socketId) => socketId !== socket.id
      );
      if (registers[identifier].length === 0) {
        delete registers[identifier]; // Clean up empty arrays
      }
    }

    console.log(
      "Updated Registers after disconnect: " + JSON.stringify(registers)
    );
  });
});


function disconnectIdentifier(identifier) {
  if (registers[identifier]) {
    registers[identifier].forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true); 
      }
    });

    delete registers[identifier];
    console.log(`Disconnected and removed identifier ${identifier} from registers.`);
  } else {
    console.log(`Identifier ${identifier} not found in registers.`);
  }
}


const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
