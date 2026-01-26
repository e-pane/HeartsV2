export function calculateGameOver(scores) {
  const someoneOverLimit = scores.some((s) => s >= 13);

  if (!someoneOverLimit) {
    return {
      gameOver: false,
      gameTied: false,
      winnerIndex: null,
      tieIndexes: null,
    };
  }

  const lowestScore = Math.min(...scores);

  const winners = scores
    .map((score, index) => ({ score, index }))
    .filter(({ score }) => score === lowestScore)
    .map(({ index }) => index);

  if (winners.length === 1) {
    return {
      gameOver: true,
      gameTied: false,
      winnerIndex: winners[0],
      tieIndexes: null,
    };
  }

  return {
    gameOver: true,
    gameTied: true,
    winnerIndex: null,
    tieIndexes: winners,
  };
}
