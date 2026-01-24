import "./styles/main.css";
import { createPlayer, createGame } from "./factories.js";
import {
  renderWaitingMessage,
  removeWaitingMessage,
  renderPlayerNames,
  renderPlayerNamesInScoreTable,
  renderDealBtn,
  wireHeartsBrokenBtn,
  wireLastTrickBtn,
} from "./pre-passUI.js";

import {
  renderPassUI,
  clearPassUI,
  renderPassBtn,
  removePassBtn,
  renderPassError,
  clearPassError,
  renderCardInPassSlot,
  renderPassSlotUndo,
  renderPassHand,
} from "./passUI.js";

import {
  highlightCurrentPlayer,
  removeAllGlow,
  renderPlayHand,
  renderOpponentHands,
  renderPlayedCard,
  removePlayedCard,
  disableUndoOnPlayedCards,
  renderClearTrickBtn,
  removeClearTrickBtn,
  clearPlayedCardSlots,
  renderHeartsBrokenMsg,
  renderLastTrick,
  clearPlayPassUI,
  renderMoonShotButtons,
  renderGameWinner,
  renderNewGameBtn,
  clearNewGameBtn,
} from "./gameUI.js";

import tree1 from "./images/Tree1.png";
import tree2 from "./images/Tree2.png";
import tree3 from "./images/Tree3.png";
import tree4 from "./images/Tree4.png";
import brokenHeart from "./images/broken-heart.png";
import lastTrick from "./images/last-trick.png";
import stanfordLogo from "./images/stanford-logo.png";
import cardTable from "./images/card-table.jpg";
import moonImg from "./images/moon.png";
import upArrowImg from "./images/moon.png";
import downArrowImg from "./images/moon.png";

// For later game rules customization
// let gameRules = null;

// export function initRules(rules) {
//   gameRules = rules;
// }

//For later UI customization
// let uiTheme = null;

// export function initTheme(theme) {
//   uiTheme = theme;
// }

// map of actionType passed from UI intent to controller.dispatch, to the right handler
const actionTypeToHandler = {
  confirmDeal: handleDeal,
  passCard: handlePassCard,
  undoPass: handleUndoPass,
  confirmPass: handleConfirmPass,
  playCard: handlePlayCard,
  undoPlay: handleUndoPlay,
  clearTrick: handleTrickOver,
  handOver: handleHandOver,
  // gameOver: handleGameOver,
  newGame: handleNewGame,
  showHeartsBrokenMsg: handleHeartsBroken,
  clearHeartsBrokenMsg: handleHeartsBroken,
  showLastTrick: handleLastTrick,
  clearLastTrick: handleLastTrick,
  moonShot: handleMoonShot,
  init: handleInit,
};

//factory to create a controller object with the dispatch instance method
function createController(actionMap) {
  const controller = Object.create(null);
  controller.dispatch = (actionType, payload) => {
    const handler = actionMap[actionType];
    if (!handler) {
      console.error("Unknown action type:", actionType, payload);
      return;
    }
    try {
      handler(payload);
    } catch (err) {
      console.error("Handler error for actionType:", actionType, err);
    }
  };
  return controller;
}

export const controller = createController(actionTypeToHandler);

// CALLBACK HANDLERS ("Flattened Dispatch Architecture")
//
// All UI click events are routed through a single controller.dispatch() method.
// UI renderers attach click listeners that call:
//
//   controller.dispatch(actionType, payload, optional flag)
//
// The dispatcher maps actionType → handler and invokes the corresponding handler
// with the payload. Handlers:
//
//   1. Use payload to mutate authoritative game state via the game facade
//   2. Query updated state from the facade as needed
//   3. Invoke UI renderers to pass stateful variables to renders to update the UI

function handleInit() {
  console.log("handleInit called");
  const result = game.getState();
  if (!result.success) return;

  renderPlayerNames(result.players, result.tricksTaken);
  renderPlayerNamesInScoreTable(result.players, "handleInit");
  renderNewGameBtn();
}

function handleDeal() {
  clearPassError();
  const result = game.dealHands();
  const firstPlayerIndex = Number(Object.keys(result.handsByPlayerIndex)[0]);
  const player1Hand = result.handsByPlayerIndex[firstPlayerIndex];

  const opponentIndexes = Object.keys(result.handsByPlayerIndex)
    .map(Number)
    .filter((i) => i !== firstPlayerIndex);

  const passDirection = result.passDirection;

  if (passDirection === "keep") {
    renderPassUI(passDirection);
    highlightCurrentPlayer(result.currentPlayerIndex);
    renderPlayHand(firstPlayerIndex, player1Hand.getCards());
    renderOpponentHands(opponentIndexes);
  } else {
    renderPassUI(passDirection);
    renderPassHand(firstPlayerIndex, player1Hand.getCards());
  }
}

function handlePassCard({ playerIndex, card }) {
  const result = game.addCardForPass(playerIndex, card);

  if (!result.success) {
    return renderPassError(result.error);
  }

  renderCardInPassSlot(playerIndex, card);

  renderPassHand(playerIndex, result.playerHand.getCards());

  if (result.selectedCardsForPass.length === 3) {
    renderPassBtn();
  } else {
    removePassBtn();
  }
}

function handleUndoPass({ playerIndex, card }) {
  const result = game.removeCardForPass(playerIndex, card);

  if (!result.success) {
    return renderPassError(result.error);
  }
  
  renderPassHand(playerIndex, result.playerHand.getCards());
  renderPassSlotUndo(card);

  if (result.selectedCardsForPass.length === 3) {
    renderPassBtn();
  } else {
    removePassBtn();
  }
}

function handleConfirmPass() {
  const result = game.passSelectedCards();
  if (!result.success) {
    return renderPassError(result.error);
  }

  clearPassError();
  removePassBtn();
  clearPassUI();

  const firstPlayerIndex = Number(Object.keys(result.handsByPlayerIndex)[0],);
  const player1Hand = result.handsByPlayerIndex[firstPlayerIndex];

  const opponentIndexes = Object.keys(result.handsByPlayerIndex)
    .map(Number)
    .filter((i) => i !== firstPlayerIndex);
  
  renderPlayHand(firstPlayerIndex, player1Hand.getCards());
  renderOpponentHands(opponentIndexes);
  highlightCurrentPlayer(result.currentPlayerIndex);
}

function handlePlayCard({ playerIndex, card }) {
  clearPassUI();
  if (!card) {
    const cardResult = game.getFirstPlayableCard(playerIndex);
    if (!cardResult.success) return;
    card = cardResult.card;
  }

  const result = game.playCard(playerIndex, card);
  const stateResult = game.getState();

  if (!result.success) return;
  if (!stateResult.success) return;
  
  const firstPlayerIndex = Number(Object.keys(stateResult.handsByPlayerIndex)[0]);
  const player1Hand = stateResult.handsByPlayerIndex[firstPlayerIndex];

  const opponentIndexes = Object.keys(stateResult.handsByPlayerIndex)
    .map(Number)
    .filter((i) => i !== firstPlayerIndex);

  renderPlayHand(firstPlayerIndex, player1Hand.getCards());
  renderOpponentHands(opponentIndexes);
  disableUndoOnPlayedCards();

  renderPlayedCard({
    playerIndex,
    card,
    undoable: game.canUndo(),
  });
  
  if (result.currentTrick.getPlays().length === 4) {
    renderClearTrickBtn();
    removeAllGlow();
  } else {
    highlightCurrentPlayer(result.currentPlayerIndex);
  }
}

function handleUndoPlay() {
  const result = game.undoLastPlay();
  if (!result.success) return;

  const stateResult = game.getState();
  if (!stateResult.success) return;

  if (stateResult.currentTrick.getPlays().length < 4) {
    removeClearTrickBtn();
  }

  removePlayedCard(result.undonePlay.playerIndex);

  const firstPlayerIndex = Number(Object.keys(stateResult.handsByPlayerIndex)[0]);
  const player1Hand = stateResult.handsByPlayerIndex[firstPlayerIndex];

  const opponentIndexes = Object.keys(stateResult.handsByPlayerIndex)
    .map(Number)
    .filter((i) => i !== firstPlayerIndex);

  renderPlayHand(firstPlayerIndex, player1Hand.getCards());
  renderOpponentHands(opponentIndexes);
  highlightCurrentPlayer(result.currentPlayerIndex);
}

function handleTrickOver() {
  const result = game.completeTrick();
  const stateResult = game.getState();

  if (!result.success) return;
  if (!stateResult.success) return;

  clearPlayedCardSlots();
  removeClearTrickBtn();

  const firstPlayerIndex = Number(
    Object.keys(stateResult.handsByPlayerIndex)[0],
  );
  const player1Hand = stateResult.handsByPlayerIndex[firstPlayerIndex];

  const opponentIndexes = Object.keys(stateResult.handsByPlayerIndex)
    .map(Number)
    .filter((i) => i !== firstPlayerIndex);

  renderPlayHand(firstPlayerIndex, player1Hand.getCards());
  renderOpponentHands(opponentIndexes);
  removeAllGlow();
  highlightCurrentPlayer(result.currentPlayerIndex);

  renderPlayerNames(stateResult.players, stateResult.tricksTaken);
  
  if (result.handOver) {
    removeAllGlow();
    controller.dispatch("handOver");
  }
}

function handleHandOver() {
  const result = game.finishHand();
  const stateResult = game.getState();

  if (!result.success) return;
  if (!stateResult.success) return;

  renderPlayerNames(stateResult.players, stateResult.tricksTaken);
  renderPlayerNamesInScoreTable(stateResult.players, "handleHandOver");

  if (result.gameOver) {
    renderGameWinner(stateResult.players, result.winnerIndex);
    renderNewGameBtn();
    return;
  }

  if (result.moonShot) {
    renderMoonShotButtons(
      stateResult.players[result.moonShooterIndex],
      result.garySpecialMessage);
  }

  else {
    clearPlayPassUI();
    renderDealBtn();
  }
}

// function handleGameOver() {
//   console.log("handleGameOver called");
//   const result = game.finishHand();
//   const stateResult = game.getState();

//   if (!result.success) return;
//   if (!stateResult.success) return;

//   renderGameWinner(stateResult.players, result.winnerIndex);
//   renderNewGameBtn();
// }

function handleNewGame() {
  const loggedPlayerNames = JSON.parse(localStorage.getItem("players")) || [];
  const players = loggedPlayerNames.map((name, index) =>
    createPlayer(name, index),
  );

  // recreate the engine with a fresh state
  game = createGame(players);
  const result = game.getState();
  renderPlayerNames(result.players, result.tricksTaken);
  renderPlayerNamesInScoreTable(result.players, "handleInit");
  clearNewGameBtn();  
  wireHeartsBrokenBtn();
  wireLastTrickBtn();
  clearPlayPassUI();
  renderDealBtn();
}

function handleMoonShot(payload) {
  clearPlayPassUI();
  let result;

  if (payload.direction === "up") {
    result = game.everyoneUp26();
  } else {
    result = game.shooterDown26();
  }
  if (!result.success) return;

  const stateResult = game.getState();
  if (!stateResult.success) return;
  
  renderPlayerNamesInScoreTable(stateResult.players, "handleMoonShot");

  if (result.gameOver) {
    renderGameWinner(stateResult.players, result.winnerIndex);
    renderNewGameBtn();
    return;
  }

  renderDealBtn();
}

function handleHeartsBroken(payload) {
  const stateResult = game.getState();
  if (!stateResult.success) return;

  if (payload?.action === "show") {
    if (!stateResult.heartsBroken) {
      renderHeartsBrokenMsg({ heartsBroken: false });
      return;
    }
  
    renderHeartsBrokenMsg({
      heartsBroken: stateResult.heartsBroken,
      trickNumber: stateResult.heartsBrokenTrick?.getTrickNumber(),
      plays:
        stateResult.heartsBrokenTrick?.getPlays()?.map(({ player, card }) => ({
          playerName: player.getName(),
          card,
        })) || [],
    });
    return;
  }

  if (payload?.action === "clear") {
    clearPlayPassUI();
    if (stateResult.currentTrick?.getPlays()?.length === 4) {
      renderClearTrickBtn();
      removeAllGlow();
    }
    if (stateResult.currentPhase !== "play" && stateResult.currentPhase !== "pass"){
     renderDealBtn();
    }
    return;
  }
}

function handleLastTrick(payload) {
  const stateResult = game.getState();
  if (!stateResult.success) return;

  if (payload?.action === "show") { 
    if (!stateResult.lastTrick) {
      console.log(">>> handleLastTrick: no last trick available");
      return;
    }

    renderLastTrick(stateResult.lastTrick);
  }

  if (payload?.action === "clear") {
    clearPlayPassUI();
    if (stateResult.currentTrick?.getPlays()?.length === 4) {
      renderClearTrickBtn();
      removeAllGlow();
    }
    return;
  }
}

// GAME FLOW //
const loggedPlayerNames = JSON.parse(localStorage.getItem("players")) || [];
// Map each name string to a Player object
const players = loggedPlayerNames.map((name, index) =>
  createPlayer(name, index)
);
let game = createGame(players);

if (loggedPlayerNames.length < 4) {
  renderWaitingMessage();
} else {
  removeWaitingMessage();
  // route to handleInit to get initial game state
  controller.dispatch("init");
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
