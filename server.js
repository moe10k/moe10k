const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const Game = require('./game');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const rooms = {};

function getRoomByPlayerId(playerId) {
  return Object.values(rooms).find(room => room.players.includes(playerId));
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = uuidv4();
    rooms[roomId] = {
      id: roomId,
      players: [socket.id],
      creator: socket.id
    };
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    console.log('Room created:', roomId);
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].players.push(socket.id);
      socket.join(roomId);
      socket.emit('roomJoined', roomId, rooms[roomId].creator);
      io.to(rooms[roomId].creator).emit('playerJoined', roomId, socket.id);
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('roomNotFound');
    }
  });

  socket.on('startGame', () => {
    const room = getRoomByPlayerId(socket.id);
    if (room && room.players.length > 1 && room.creator === socket.id) {
      Game.startGameForRoom(room, io, socket);
    }
  });

  socket.on('disconnect', () => {
    const room = getRoomByPlayerId(socket.id);
    if (room) {
      room.players = room.players.filter(playerId => playerId !== socket.id);
      if (room.players.length === 0) {
        delete rooms[room.id];
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
