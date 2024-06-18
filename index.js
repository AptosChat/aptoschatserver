const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Change this to the deployed client's URL
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

app.use(cors());

const PORT = process.env.PORT || 5000;

let rooms = {};

app.get('/', (req, res) => {
  res.send('Video chat server running');
});

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('createRoom', () => {
    const roomId = socket.id;
    rooms[roomId] = { occupants: [] };
    socket.join(roomId);
    rooms[roomId].occupants.push(socket.id);
    socket.emit('roomCreated', roomId);
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].occupants.push(socket.id);
      socket.emit('roomJoined', roomId);
      socket.to(roomId).emit('ready');
    } else {
      socket.emit('error', 'Room not found');
    }
  });

  socket.on('offer', (roomId, offer) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (roomId, answer) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (roomId, candidate) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    for (const roomId in rooms) {
      rooms[roomId].occupants = rooms[roomId].occupants.filter(id => id !== socket.id);
      if (rooms[roomId].occupants.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
