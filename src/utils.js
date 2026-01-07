export function createDeck() {
  const suits = ["C", "D", "H", "S"];
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  const deck = [];

  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank, svg: `${rank}${suit}.svg` });
    }
  }

  return deck;
}

export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function deal(deck, numPlayers, handSize) {
  const hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(deck.slice(i * handSize, (i + 1) * handSize));
  }
  return hands;
}
