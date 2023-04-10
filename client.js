const socket = io();

const joinBtn = document.getElementById('join-btn');
const createBtn = document.getElementById('create-btn');
const roomIdInput = document.getElementById('room-id');
const startBtn = document.getElementById('start-btn');

const lettersElement = document.getElementById('letters');
const inputElement = document.getElementById('word-input');
const submitBtn = document.getElementById('submit-word');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

const gameRooms = document.getElementById('game-rooms');
const gameArea = document.getElementById('game-area');

joinBtn.addEventListener('click', () => {
  const roomId = roomIdInput.value;
  if (roomId) {
    socket.emit('joinRoom', roomId);
  }
});

createBtn.addEventListener('click', () => {
  socket.emit('createRoom');
});

startBtn.addEventListener('click', () => {
  console.log('Start game button clicked'); // Add a log here
  socket.emit('startGame');
});

submitBtn.addEventListener('click', () => {
  const word = inputElement.value;
  socket.emit('submitWord', word);
  inputElement.value = '';
});

socket.on('roomCreated', (roomId) => {
  alert(`Room created with ID: ${roomId}`);
  roomIdInput.value = roomId;
});

socket.on('roomJoined', (roomId, creatorId) => {
  alert(`Joined room with ID: ${roomId}`);
  gameRooms.style.display = 'none';
  gameArea.style.display = 'block';
  startBtn.disabled = socket.id !== creatorId;
  startBtn.disabled = false;
});

socket.on('roomNotFound', () => {
  alert('Room not found. Please check the room ID and try again.');
});

socket.on('newLetters', (newLetters) => {
  lettersElement.textContent = newLetters.join(' ');
});

socket.on('timerUpdate', (timer) => {
  timerElement.textContent = timer;
});

socket.on('scoreUpdate', (score) => {
  scoreElement.textContent = score;
});

socket.on('livesUpdate', (lives) => {
  livesElement.textContent = lives;
});

socket.on('gameOver', () => {
  alert('Game Over!');
});
