import('node-fetch').then(module => {
  fetch = module.default;
});

function initializePlayerStates(room) {
  const playerStates = room.players.map(playerId => ({
    playerId,
    score: 0,
    lives: 3,
    timer: 10
  }));
  return playerStates;
}

function generateNewLetters() {
  return [
    String.fromCharCode(Math.floor(Math.random() * 26) + 65),
    String.fromCharCode(Math.floor(Math.random() * 26) + 65)
  ];
}

async function handlePlayerTurn(room, currentPlayer, playerStates, currentLetters, io, socket) {
  currentPlayer.timer = 10;
  io.to(currentPlayer.playerId).emit('timerUpdate', currentPlayer.timer);

  const countdown = setInterval(() => {
    currentPlayer.timer--;
    io.to(currentPlayer.playerId).emit('timerUpdate', currentPlayer.timer);

    if (currentPlayer.timer <= 0) {
      clearInterval(countdown);
      currentPlayer.lives--;
      io.to(currentPlayer.playerId).emit('livesUpdate', currentPlayer.lives);

      if (currentPlayer.lives <= 0) {
        io.to(currentPlayer.playerId).emit('gameOver');
        playerStates.push(currentPlayer);
      } else {
        playerStates.push(currentPlayer);
        startNewRound(room, playerStates, io, socket);
      }
    }
  }, 1000);

  const submitWordListener = async (word) => {
    clearInterval(countdown);

    if (await isValidWord(word, currentLetters)) {
      currentPlayer.score++;
      io.to(currentPlayer.playerId).emit('scoreUpdate', currentPlayer.score);
    } else {
      currentPlayer.lives--;
      io.to(currentPlayer.playerId).emit('livesUpdate', currentPlayer.lives);
    }

    if (currentPlayer.lives <= 0) {
      io.to(currentPlayer.playerId).emit('gameOver');
    } else {
      playerStates.push(currentPlayer);
      startNewRound(room, playerStates, io, socket);
    }

    socket.removeListener('submitWord', submitWordListener);
  };

  socket.on('submitWord', submitWordListener);
}

function startNewRound(room, playerStates, io, socket) {
  const newLetters = generateNewLetters();
  room.players.forEach(playerId => {
    io.to(playerId).emit('newLetters', newLetters);
  });

  const currentPlayer = playerStates.shift();
  handlePlayerTurn(room, currentPlayer, playerStates, newLetters, io, socket);
}

async function isValidWord(word, currentLetters) {
  if (word.toUpperCase().includes(currentLetters[0]) && word.toUpperCase().includes(currentLetters[1])) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await response.json();

    return data && !data.error;
  }
  return false;
}

function startGameForRoom(room, io, socket) {
  const playerStates = initializePlayerStates(room);
  startNewRound(room, playerStates, io, socket);
}

module.exports = {
  startGameForRoom
};
