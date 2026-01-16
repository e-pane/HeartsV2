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
} from "./gameUI.js";

import tree1 from "./images/Tree1.png";
import tree2 from "./images/Tree2.png";
import tree3 from "./images/Tree3.png";
import tree4 from "./images/Tree4.png";
import brokenHeart from "./images/broken-heart.png";
import lastTrick from "./images/last-trick.png";
import stanfordLogo from "./images/stanford-logo.png";
import cardTable from "./images/card-table.jpg";

// map of actionType passed from UI intent to controller.dispatch, to the right handler
const actionTypeToHandler = {
  confirmDeal: handleDeal,
  passCard: handlePassCard,
  undoPass: handleUndoPass,
  confirmPass: handleConfirmPass,
  playCard: handlePlayCard,
  undoPlay: handleUndoPlay,
  clearTrick: handleClearTrick,
  showHeartsBrokenMsg: handleHeartsBroken,
  clearHeartsBrokenMsg: handleHeartsBroken,
  showLastTrick: handleLastTrick,
  clearLastTrick: handleLastTrick,
  // startNewGame: handleNewGame,
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
//
// Each handler below will be prefaced by comments of 
// UI intent: UI renderer of origin: actionType : payload : flag : state queried: state mutations: 
// renderer called: stateful variables passed to renderer


// deal hand - enter pass phase: renderDealBtn: confirmDeal: none: none: players (array of 
// 4 player objects) - currentPlayer object: none: renderPassHand(): currentPlayer
function handleDeal() {
  game.finishDeal();
  const players = game.getPlayers(); // facade call
  const currentPlayer = players[0];
  renderPassHand(currentPlayer);
  renderPassUI(); // enable passing
}
// pass card: renderPassHand: passCard: card obj. : none: players (array of 4 player objects)
// : add to _selectedCardsForPass - remove card from hand instance: renderCardInPassSlot: 
// card obj
function handlePassCard({ card }) {
  game.addCardForPass(card);
  renderCardInPassSlot(card);
  const players = game.getPlayers(); // get current player objects
  const currentPlayer = players[0];
  renderPassHand(currentPlayer);
  renderPassSlotUndo();

  const selected = game.getSelectedCardsForPass();
  if (selected.length === 3) {
    renderPassBtn();
  } else {
    removePassBtn();
  }
}

// undo pass card: renderCardInPassSlot: undoPass: card object: none : players array - passed 
// cards array: remove card from passed cards array - add it back to hand array: renderPassHand
// - renderPassSlotUndo: card object
//
function handleUndoPass({ card }) {
  game.removeCardForPass(card);
  const players = game.getPlayers(); // get current player objects
  const currentPlayer = players[0]; 
  renderPassHand(currentPlayer);
  renderPassSlotUndo(card);

  // 4️⃣ Update pass button if needed
  const selected = game.getSelectedCardsForPass();
  if (selected.length === 3) {
    renderPassBtn();
  } else {
    removePassBtn();
  }
}
// confirm pass (enter play phase): renderPassBtn: confirmPass: none: none: get passed cards 
// to confirm legal pass get players object - get current player index: accomplish passing 
// and reset all players' hands according to pass - change phase to play - set current player
// to whoever has 2C - create first trick: currentPlayer - players - current player index
function handleConfirmPass() {
  removePassBtn(); 

  const selected = game.getSelectedCardsForPass();
  if (selected.length !== 3) {
    renderPassError("You need to pass 3 cards");
    return;
  }

  clearPassError();

  game.confirmPass();
  clearPassUI();
  const players = game.getPlayers(); // get current player objects
  const currentPlayer = players[0]; 
  renderPlayHand(currentPlayer);
  renderOpponentHands(players);
  game.enterPlayPhase();
  highlightCurrentPlayer(game.getCurrentPlayerIndex());
}

// play card: renderPlayHand - renderOpponentHands: playCard: player and card objects: none:
// get players array - get hand instance and cards of player playing a card: play the card:
// renderPlayedCard (and renderPlayHand and renderOpponentHands and highlightCurrentPlayer):
// player, card, playerIndex, undoable flag set to true
function handlePlayCard({ player, card }) {
  const players = game.getPlayers(); // current player objects
  const currentPlayer = players[0];
  const playerIndex = players.indexOf(player);

  let cardToPlay = card;

  if (!cardToPlay) {
    cardToPlay = null;
    for (const c of player.getHand().getCards()) {
      console.log("Trying card:", c.rank + c.suit);
      if (game.playCard(player, c)) {
        console.log("Success! Played card:", c.rank + c.suit);
        cardToPlay = c;
        break; // stop at first successful card
      } else {
        console.log("Cannot play card:", c.rank + c.suit);
      }

    }
    if (!cardToPlay) {
      console.error("No playable card found for player", player.getName());
      return;
    }
  } else {
    console.log(
      ">>> Human clicked card, attempting play:",
      cardToPlay.rank + cardToPlay.suit
    );
    if (!game.playCard(player, cardToPlay)) {
      console.error(
        "playCard failed for player",
        player.getName(),
        "card",
        cardToPlay.rank + cardToPlay.suit
      );
      return;
    }
    console.log("Play succeeded:", cardToPlay.rank + cardToPlay.suit);
  }
  
  renderPlayHand(currentPlayer);
  renderOpponentHands(players);
  disableUndoOnPlayedCards();
  renderPlayedCard(player, cardToPlay, {
    playerIndex,
    undoable: true,
  });

  if (game.getCurrentTrick().getPlays().length === 4) {
    renderClearTrickBtn();
    removeAllGlow();
  } else {
    highlightCurrentPlayer(game.getCurrentPlayerIndex());
  }
}

// undo play: renderPlayedCard: undoPlay: none: none: get players array: - call game.undoLastPlay
// to add card back to players hand -  renderPlayHand - 
// renderOpponentHands, highlightCurrentPlayer
function handleUndoPlay() {
  const undone = game.undoLastPlay();
  if (!undone) return;

  removeClearTrickBtn();
  removePlayedCard(undone.playerIndex);

  const players = game.getPlayers();
  const currentPlayer = players[0];

  renderPlayHand(currentPlayer);
  renderOpponentHands(players);
  highlightCurrentPlayer(game.getCurrentPlayerIndex());
}

// clear trick - move to next trick: renderClearTrickBtn: clearTrick: none: none: winnerIndex -
// players array tricksTaken: sets winnerIndex - tallies trick points - increments winner's 
// tricksTaken - sets the trick just cleared to lastTrick, increments trick number - sets CPI
// to winnerIndex - clears lastPlay: 6 renderers called: players, tricksTaken, winnerIndex
function handleClearTrick() {
  const winnerIndex = game.completeTrick(); 
  const players = game.getPlayers();
  const tricksTaken = game.getTricksTaken(); 

  clearPlayedCardSlots();
  removeClearTrickBtn();

  const currentPlayer = players[winnerIndex];

  renderPlayerNames(players, tricksTaken);
  renderPlayHand(players[0]);
  renderOpponentHands(players);
  highlightCurrentPlayer(winnerIndex);

  // if the hand is over, call finishHand()
  const lastTrickNumber = game.getCurrentTrick().getTrickNumber() - 1;
  if (lastTrickNumber === 13) {
    game.finishHand();
    removeAllGlow();
    renderPlayerNames(players, game.getTricksTaken()); 
    // query the engine for moonShot bool
    // if it's true, render up and down arrow
    renderPlayerNamesInScoreTable(players); 
    renderDealBtn()
  }
}

// render/remove heartsBroken msg: wireHeartsBrokenBtn/renderHeartsBrokenMsg: showHeartsBrokenMsg/
// clearHeartsBrokenMsg: show/clear: none: heartsBrokenTrick, that trick's plays: 
// renderHeartsBrokenMsg: bool flag, trick number, plays
function handleHeartsBroken(payload) {
  const lastTrick = game.getLastTrick();
  if (!lastTrick) {
    console.log("No trick yet for hearts broken check");
    return;
  }
  if (payload?.action === "clear") {
    clearPlayPassUI();
    if (game.getCurrentTrick().getPlays().length === 4) {
      renderClearTrickBtn();
      removeAllGlow();
    } 
    return;
  }

  if (!game.areHeartsBroken()) {
    renderHeartsBrokenMsg({ heartsBroken: false });
    return;
  }

  const trick = game.getHeartsBrokenTrick();
  const trickNumber = trick.getTrickNumber();
  const plays = trick.getPlays().map(({ player, card }) => ({
    playerName: player.getName(),
    card,
  }));

  renderHeartsBrokenMsg({
    heartsBroken: true,
    trickNumber,
    plays,
  });
}
// Each handler below will be prefaced by comments of 
// UI intent: UI renderer of origin: actionType : payload : flag : state queried: state mutations: 
// renderer called: stateful variables passed to renderer
function handleLastTrick(payload) {
  if (payload?.action === "clear") {
    clearPlayPassUI();
    if (game.getCurrentTrick().getPlays().length === 4) {
      renderClearTrickBtn();
      removeAllGlow();
    } 
    return;
  }
  const lastTrick = game.getLastTrick();
  if (!lastTrick) {
    console.log(">>> handleLastTrick: no last trick available");
    return;
  }

  renderLastTrick(lastTrick);
}

// GAME FLOW //
const loggedPlayerNames = JSON.parse(localStorage.getItem("players")) || [];

// Map each name string to a Player object
const players = loggedPlayerNames.map((name, index) =>
  createPlayer(name, index)
);
const game = createGame(players);
const tricksTaken = game.getTricksTaken();

if (loggedPlayerNames.length < 4) {
  renderWaitingMessage();
} else {
  removeWaitingMessage();
  renderDealBtn(handleDeal);
  // deal button click listener will have the new callback to the controller.dispatch
  renderPlayerNames(players, tricksTaken);
  renderPlayerNamesInScoreTable(players);

  // Wire the special buttons for later game interactions
  wireHeartsBrokenBtn(); 
  wireLastTrickBtn();
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
