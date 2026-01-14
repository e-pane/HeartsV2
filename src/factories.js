import { createGameEngine } from "./gameEngine.js";

// factory to create a 52 card deck as an array of 52 objects called deck.
function createDeck() {
  let suits = ["C", "D", "S", "H"];
  let ranks = [2, 3, 4, 5, 6, 7, 8, 9, "T", "J", "Q", "K", "A"];
  let deck = [];

  for (let suit of suits) {
    for (let rank of ranks) {
      let card = {
        suit,
        rank,
        svg: `${rank}${suit}.svg`,
        faceUp: false,
        inTrick: false,
        playable: true,
      };
      deck.push(card);
    }
  }
  return deck;
}
// factory to create a Player object with instance getters for that player's hand, tricks, score and
// name, and setters for add the player to a trick, ++ score and set the players hand by passing
// a handInstance.
function createPlayer(name, id) {
  let _name = name;
  let _hand = [];
  let _tricks = [];
  let _score = 0;

  const player = Object.create(null);

  player.getHand = () => _hand;
  player.getTricks = () => _tricks;
  player.getScore = () => _score;
  player.getName = () => _name;
  player.addTrick = (trick) => _tricks.push(trick);
  player.incrementScore = (points) => {
    _score += points;
  };

  player.setHand = (handInstance) => {
    _hand = handInstance;
  };

  return player;
}
// util to help sort cards from C-D-S-H and 2-A
function cardComparer(a, b) {
  const suitOrder = {
    C: 0,
    D: 1,
    S: 2,
    H: 3,
  };

  const rankOrder = {
    2: 0,
    3: 1,
    4: 2,
    5: 3,
    6: 4,
    7: 5,
    8: 6,
    9: 7,
    T: 8,
    J: 9,
    Q: 10,
    K: 11,
    A: 12,
  };

  if (suitOrder[a.suit] !== suitOrder[b.suit]) {
    return suitOrder[a.suit] - suitOrder[b.suit];
  }

  return rankOrder[a.rank] - rankOrder[b.rank];
}
// factory to create a hand object with a getter to get the cards in the hand, methods
// to add/remove a card from the hand, and sort the hand
function createHand(cards) {
  let _cards = cards;

  const hand = Object.create(null);

  hand.getCards = () => _cards.slice();
  hand.removeCard = (card) => {
    const idx = _cards.findIndex(
      (c) => c.rank === card.rank && c.suit === card.suit
    );
    if (idx === -1) return null;
    return _cards.splice(idx, 1)[0];
  };

  hand.addCard = (card) => {
    _cards.push(card);
  };

  hand.sort = () => _cards.sort(cardComparer);

  return hand;
}
// factory to create a trick object with add/remove cards from trick, getters for cards in the
// trick, who led the trick, winner of the trick and trick number, and setter to set the
// winner of the trick
function createTrick(leadPlayer, trickNumber) {
  let _plays = [];
  let _leadPlayer = leadPlayer;
  let _winnerIndex = null;
  let _trickNumber = trickNumber;

  const trick = Object.create(null);

  trick.addPlay = (player, card) => {
    _plays.push({ player, card });
  };
  trick.undoLastPlay = () => {
    if (_plays.length === 0) return null;
    return _plays.pop();
  };
  trick.getPlays = () => _plays.slice();
  trick.getLeadPlayer = () => _leadPlayer;
  trick.setWinnerIndex = (index) => {
    _winnerIndex = index;
  };

  trick.getWinnerIndex = () => _winnerIndex;
  trick.getTrickNumber = () => _trickNumber;

  return trick;
}
/* createGame(players) factory to create the **Game Facade** — the single, UI-safe interface
 * between the UI layer and the internal game engine.
 *
 * Responsibilities:
 * -----------------
 * - Owns exactly one instance of the game engine.
 * - Exposes a **restricted, intention-based API** for the UI.
 * - Prevents the UI from accessing or mutating engine state directly.
 *
 * Architectural role:
 * -------------------
 * UI code MUST talk to the game through this object, never to the engine.
 * The facade translates high-level UI intent (e.g. "play this card",
 * "deal a hand", "undo") into engine calls, while hiding engine internals
 * such as turn advancement, rule enforcement, and state bookkeeping.
 *
 * What this object IS:
 * --------------------
 * - A stable public API for the UI
 * - A firewall between rendering code and game rules
 * - A coordinator that enforces architectural boundaries
 *
 * What this object IS NOT:
 * ------------------------
 * - It does NOT contain game rules
 * - It does NOT own game state
 * - It does NOT make legality decisions
 *
 * All rules, validation, and state mutations live exclusively in the
 * game engine. If the UI needs new information or actions, they must
 * be exposed here explicitly rather than reaching into the engine.
 *
 * Invariant:
 * ----------
 * UI → Game Facade → Game Engine
 * UI must never call engine methods directly.
 */
function createGame(players) {
  let _engine = createGameEngine(players);

  const game = Object.create(null);
  // Change game phase
  game.finishDeal = () => _engine.dealHands();
  game.confirmPass = () => _engine.passSelectedCards();
  game.enterPlayPhase = () => _engine.enterPlayPhase();

  // Play a card (UI calls this on click)
  game.playCard = (player, card) => _engine.playCard(player, card);

  // Undo last play
  game.undoLastPlay = () => _engine.undoLastPlay();

  // Add/remove card for pass selection
  game.addCardForPass = (card) => _engine.addCardForPass(card);
  game.removeCardForPass = (card) => _engine.removeCardForPass(card);

  game.isFirstTrick = () => _engine.isFirstTrick();
  game.completeTrick = () => _engine.completeTrick();

  // Expose state getters
  game.getCurrentPlayer = () => _engine.getCurrentPlayer();
  game.getCurrentPlayerIndex = () => _engine.getCurrentPlayerIndex();
  game.getPlayers = () => _engine.getPlayers();
  game.getCurrentPhase = () => _engine.getCurrentPhase();
  game.getSelectedCardsForPass = () => _engine.getSelectedCardsForPass();
  game.getCurrentTrick = () => _engine.getCurrentTrick();
  game.getLastTrick = () => _engine.getLastTrick();
  game.areHeartsBroken = () => _engine.areHeartsBroken();
  game.getHeartsBrokenTrick = () => _engine.getHeartsBrokenTrick(); 
  game.isTrickComplete = () => _engine.isTrickComplete();
  game.isHandComplete = () => _engine.isHandComplete();
  game.getScores = () => _engine.getScores();
  game.getTricksTaken = () => _engine.getTricksTaken();
  game.canUndo = () => _engine.canUndo();

  return game;
}
function shuffle(deck) {
  let currentIndex = deck.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [deck[currentIndex], deck[randomIndex]] = [
      deck[randomIndex],
      deck[currentIndex],
    ];
  }

  return deck;
}

export {
  createDeck,
  createPlayer,
  createHand,
  createTrick,
  createGame,
  shuffle,
  cardComparer,
};
