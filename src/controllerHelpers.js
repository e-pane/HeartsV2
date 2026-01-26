export function extractHandsAndIndexes(handsByPlayerIndex) {
  const firstPlayerIndex = Number(Object.keys(handsByPlayerIndex)[0]);
  const player1Hand = handsByPlayerIndex[firstPlayerIndex];

  const opponentIndexes = Object.keys(handsByPlayerIndex)
    .map(Number)
    .filter((i) => i !== firstPlayerIndex);

  return { firstPlayerIndex, player1Hand, opponentIndexes };
}

export function checkGameOver(result, stateResult) {
  if (!result || !stateResult) return { gameOver: false };

  if (result.currentPhase !== "gameOver") {
    return { gameOver: false };
  }

  const players = stateResult.players;

  if (result.gameTied) {
    return {
      gameOver: true,
      gameTied: true,
      players,
      tieIndexes: result.tieIndexes,
    };
  }

  return {
    gameOver: true,
    gameTied: false,
    players,
    winnerIndex: result.winnerIndex,
  };
}


