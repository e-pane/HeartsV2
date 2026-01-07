import "./styles/main.css";
import { createPlayer } from "./factories.js";
import { createGameEngine } from "./gameEngine.js";
import {
  renderWaitingMessage,
  removeWaitingMessage,
  renderPlayerNames,
  renderPlayerNamesInScoreTable,
  renderDealBtn,
} from "./pre-passUI.js";

import {
  renderPassUI,
  clearPassUI,
  renderPassError,
  clearPassError,
  enablePassSlotUndo,
  renderPassBtn,
  removePassBtn,
  renderCardInPassSlot,
} from "./passUI.js";

import {
  highlightCurrentPlayer,
  renderHand,
  renderOpponentHands,
  moveCardToPlayArea,
  renderPlayedCard,
} from "./gameUI.js";

import tree1 from "./images/Tree1.png";
import tree2 from "./images/Tree2.png";
import tree3 from "./images/Tree3.png";
import tree4 from "./images/Tree4.png";
import brokenHeart from "./images/broken-heart.png";
import lastTrick from "./images/last-trick.png";
import stanfordLogo from "./images/stanford-logo.png";
import cardTable from "./images/card-table.jpg";

//call back to renderPassBtn() has game flow logic
function handlePassConfirmed() {
  removePassBtn(); 

  const selected = gameEngine.getSelectedCardsForPass();
  if (selected.length !== 3) {
    renderPassError("You need to pass 3 cards");
    return;
  }

  clearPassError();

  gameEngine.passSelectedCards();

  gameEngine.setCurrentPhase("play");
  enterPlayPhase();
}
//call back to renderDealBtn() has game flow logic in in
function handleDealConfirmed() {
  gameEngine.dealHands();
  const players = gameEngine.getPlayers();
  renderHand(players[0], handleCardClick);
  renderPassUI(); // enable passing
  enablePassSlotUndo(handlePassUndo);
}
//handles passing cards from hand to pass slots
function handleCardClick(player, card) {
  gameEngine.addCardForPass(card);
  renderCardInPassSlot(card);

  // 3️⃣ Render Pass button if needed
  if (gameEngine.getSelectedCardsForPass().length === 3) {
    renderPassBtn(handlePassConfirmed);
  } else {
    removePassBtn();
  }

  // 4️⃣ Re-render hand
  renderHand(players[0], handleCardClick);
}
//handles un-passing cards - moving them from pass slots back to hand
function handlePassUndo(card) {
  // 1️⃣ Update game state
  gameEngine.removeCardForPass(card);

  // 2️⃣ Add card back to player's hand
  const player = players[0];
  player.getHand().addCard(card);
  player.getHand().sort();

  // 3️⃣ Re-render hand
  renderHand(players[0], handleCardClick);

  // 4️⃣ Update pass button if needed
  const selected = gameEngine.getSelectedCardsForPass();
  if (selected.length === 3) {
    renderPassBtn(handlePassConfirmed);
  } else {
    removePassBtn();
  }
}

function enterPlayPhase() {
  clearPassUI();
  gameEngine.startPlayPhase();
  renderHand(players[0], handlePlayCard);
  renderOpponentHands(handleOpponentPlay);
  
  highlightCurrentPlayer(gameEngine.getCurrentPlayerIndex());
}
// call back to renderOpponentHands()
function handleOpponentPlay(playerIndex) {
  const opponent = players[playerIndex];
  if (!opponent?.getHand()) return;

  let cardToPlay = null;
  for (const c of opponent.getHand().getCards()) {
    if (gameEngine.playCard(opponent, c)) {
      cardToPlay = c;
      break;
    }
  }
  if (!cardToPlay) return;

  // UI: render the played card
  renderPlayedCard(opponent, cardToPlay, players, handleUndoLastPlayed);

  // Re-render opponent hands symbolically (single card back)
  renderOpponentHands(handleOpponentPlay);

  // Update highlighting and check trick/hand completion
  highlightCurrentPlayer(gameEngine.getCurrentPlayerIndex());
  if (gameEngine.isTrickComplete()) gameEngine.completeTrick();
  if (gameEngine.isHandComplete()) {
    // handle end-of-hand scoring, reset, etc.
  }
}
//call back to renderHand()
function handlePlayCard(player, card) {
  if (!gameEngine.playCard(player, card)) {
    return;
  }

  // Remove card from hand UI
  renderHand(players[0], handlePlayCard);

  // Render the played card in the play area
  renderPlayedCard(player, card, players, handleUndoLastPlayed);

  if (gameEngine.isTrickComplete()) {
    gameEngine.completeTrick();
  }

  if (gameEngine.isHandComplete()) {
    // handle end-of-hand scoring, reset, etc.
  }

  highlightCurrentPlayer(gameEngine.getCurrentPlayerIndex());
}
// call back to renderPlayedCard() and moveCardToPlayArea()
function handleUndoLastPlayed(player) {
  console.log({
    phase: gameEngine.getCurrentPhase?.(),
    trickNumber: gameEngine.getCurrentTrick().getTrickNumber(),
    lastPlay: gameEngine.getLastPlay?.(),
  });
  const undone = gameEngine.undoLastPlay();
  if (!undone) return;

  gameEngine.setCurrentPlayer(player);
  
  ["played1", "played2", "played3", "played4"].forEach((id) => {
    const slot = document.getElementById(id);
    if (slot) slot.innerHTML = "";
  });

  gameEngine
    .getCurrentTrick()
    .getPlays()
    .forEach(({ player, card }) => {
      renderPlayedCard(player, card, players, handleUndoLastPlayed);
    });
  
  renderHand(players[0], handlePlayCard);
  renderOpponentHands(handleOpponentPlay);
  
  const currentPlayerIndex = players.indexOf(player);
  console.log("Highlighting player index:", currentPlayerIndex);
  highlightCurrentPlayer(currentPlayerIndex);
}
// GAME FLOW //
const loggedPlayerNames = JSON.parse(localStorage.getItem("players")) || [];

// Map each name string to a Player object
const players = loggedPlayerNames.map((name, index) =>
  createPlayer(name, index)
);
const gameEngine = createGameEngine(players);

if (loggedPlayerNames.length < 4) {
  renderWaitingMessage();
} else {
  removeWaitingMessage();
  renderDealBtn(handleDealConfirmed);
  renderPlayerNames(players);
  renderPlayerNamesInScoreTable(players);
}

const imgTree1 = document.getElementById("Tree1");
const imgTree2 = document.getElementById("Tree2");
const imgTree3 = document.getElementById("Tree3");
const imgTree4 = document.getElementById("Tree4");

const btnBrokenHeart = document.querySelector(".broken-heart img");
const btnLastTrick = document.querySelector(".last-trick img");

const logo = document.querySelector(".logo");

imgTree1.src = tree1;
imgTree2.src = tree2;
imgTree3.src = tree3;
imgTree4.src = tree4;

btnBrokenHeart.src = brokenHeart;
btnLastTrick.src = lastTrick;

logo.src = stanfordLogo;
