import { controller } from "./index.js";
import { removeById, clearElementById, clearPlayPassUI } from "./rendererHelpers.js";

import moonImg from "./images/moon.png";
import upArrowImg from "./images/up-arrow.png";
import downArrowImg from "./images/down-arrow.png";

// puts a gold glow on current player
export function highlightCurrentPlayer(playerIndex) {
  const highlightGlow = "glow-highlight-pulse";

  document.querySelectorAll(".glow-container").forEach((el) => {
    el.classList.remove(highlightGlow);
  });

  const containers = ["glow1", "glow2", "glow3", "glow4"];
  const el = document.getElementById(containers[playerIndex]);
  if (el) el.classList.add(highlightGlow);
  else console.log("No element found for index:", playerIndex);
}

export function removeAllGlow() {
  const highlightGlow = "glow-highlight-pulse";
  document.querySelectorAll(".glow-container").forEach((el) => {
    el.classList.remove(highlightGlow);
  });
}
// allows a click on any player1 card to send play card intent to dispatch
export function renderPlayHand(playerIndex, cards) {
  const handContainer = document.getElementById("player-hand");
  if (!handContainer) return;

  clearElementById("player-hand");

  cards.forEach((card) => {
    const cardEl = document.createElement("img");
    cardEl.src = `/images/svg-cards/${card.svg}`;
    cardEl.className = "card";
    cardEl.dataset.rank = card.rank;
    cardEl.dataset.suit = card.suit;

    cardEl.addEventListener("click", () => {
      controller.dispatch("playCard", { playerIndex, card });
    });
    handContainer.appendChild(cardEl);
  });
}

// allow a click on the card back of any opponent to send play card intent to dispatch
export function renderOpponentHands(playerIndexes) {
  const cardBackPath = "/images/svg-cards/1B.svg";

  const layout = [
    { handId: "hand2", orientation: "horizontal", playerIndex: 1 },
    { handId: "hand3", orientation: "vertical", playerIndex: 2 },
    { handId: "hand4", orientation: "horizontal", playerIndex: 3 },
  ];

  layout.forEach(({ handId, orientation, playerIndex }) => {
    if (!playerIndexes.includes(playerIndex)) return;

    const container = document.getElementById(handId);
    if (!container) return;

    clearElementById(handId);

    const img = document.createElement("img");
    img.src = cardBackPath;
    img.classList.add("card", "opponent-card", orientation);
    img.style.cursor = "pointer";

    img.addEventListener("click", () => {
      controller.dispatch("playCard", { playerIndex });
    });

    container.appendChild(img);
  });
}
// allow a click on any played card to send undo play intent to dispatch
export function renderPlayedCard({ playerIndex, card, undoable }) {
  const slotIds = ["played1", "played2", "played3", "played4"];
  const slot = document.getElementById(slotIds[playerIndex]);
  if (!slot) return;

  clearElementById(slotIds[playerIndex]);

  const img = document.createElement("img");
  img.src = `/images/svg-cards/${card.svg}`;
  img.classList.add("played-card");

  if (playerIndex === 0 || playerIndex === 2) {
    // Player1 and Player3
    img.classList.add("vertical");
  } else {
    // Player2 and Player4
    img.classList.add("horizontal");
  }

  if (undoable) {
    img.addEventListener("click", () => {
      controller.dispatch("undoPlay");
    });
  }

  slot.appendChild(img);
}

export function removePlayedCard(playerIndex) {
  const slotIds = ["played1", "played2", "played3", "played4"];
  clearElementById(slotIds[playerIndex]);
}

export function disableUndoOnPlayedCards() {
  document.querySelectorAll(".played-card").forEach((img) => {
    const clone = img.cloneNode(true); // removes all listeners
    img.replaceWith(clone);
  });
}
// allow a click on Clear Trick btn to send clear trick intent to dispatch
// will need to wire this to just the winner's UI in multi-client mode
export function renderClearTrickBtn(winnerIndex) {
  const playUI = document.getElementById("play-pass-ui");
  if (!playUI) return;

  if (document.querySelector(".clearTrick-btn")) return;

  const passBtn = document.createElement("button");
  passBtn.classList.add("clearTrick-btn");
  passBtn.innerText = "Clear Trick";

  passBtn.addEventListener("click", () => {
    controller.dispatch("clearTrick");
  });

  playUI.appendChild(passBtn);
}

export function removeClearTrickBtn() {
  const btn = document.querySelector(".clearTrick-btn");
  if (btn) btn.remove();
}

export function clearPlayedCardSlots() {
  const slotIds = ["played1", "played2", "played3", "played4"];
  slotIds.forEach((id) => clearElementById(id));
}

export function renderHeartsBrokenMsg({ heartsBroken, trickNumber, plays }) {
  const container = document.getElementById("play-pass-ui");
  if (!container) return;

  clearPlayPassUI();

  const overlay = document.createElement("div");
  overlay.classList.add("last-trick-overlay");

  const clearBtn = document.createElement("button");
  clearBtn.classList.add("clear-last-trick-btn");
  clearBtn.textContent = "✕";
  clearBtn.addEventListener("click", () => {
    controller.dispatch("clearHeartsBrokenMsg", { action: "clear" });
  });
  overlay.appendChild(clearBtn);

  

  const row = document.createElement("div");
  row.classList.add("last-trick-row");

  if (!heartsBroken) {
    const col = document.createElement("div");
    col.classList.add("last-trick-col");
    const msg = document.createElement("p");
    msg.textContent = "Not yet, gourdhead";
    msg.classList.add("hearts-not-broken-msg");

    col.appendChild(msg);
    row.appendChild(col);
  } else {
    const footer = document.createElement("p");
    footer.classList.add("trick-number");
    footer.textContent = `Trick #${trickNumber}`;
    overlay.appendChild(footer);

    plays.forEach(({ playerName, card }) => {
      const col = document.createElement("div");
      col.classList.add("last-trick-col");

      const name = document.createElement("p");
      name.classList.add("player-name-wrapper");
      name.textContent = playerName;
      col.appendChild(name);

      const cardImg = document.createElement("img");
      cardImg.classList.add("last-trick-card");
      cardImg.src = `/images/svg-cards/${card.rank}${card.suit}.svg`;
      col.appendChild(cardImg);

      row.appendChild(col);
    });
  }
  overlay.appendChild(row);
  container.appendChild(overlay);
}

export function renderLastTrick(trick) {
  if (!trick) {
    return;
  }
  const container = document.getElementById("play-pass-ui");
  if (!container) return;
  
  clearPlayPassUI();

  const overlay = document.createElement("div");
  overlay.classList.add("last-trick-overlay");

  // ✕ button to clear overlay
  const clearBtn = document.createElement("button");
  clearBtn.classList.add("clear-last-trick-btn");
  clearBtn.textContent = "✕";
  clearBtn.addEventListener("click", () => {
    controller.dispatch("clearLastTrick", { action: "clear" });
  });
  overlay.appendChild(clearBtn);

  // Trick number at the top
  const footer = document.createElement("p");
  footer.classList.add("trick-number");
  footer.textContent = `Trick #${trick.getTrickNumber()}`;
  overlay.appendChild(footer);

  // Row container for the 4 plays
  const row = document.createElement("div");
  row.classList.add("last-trick-row");

  trick.getPlays().forEach(({ player, card }) => {
    const col = document.createElement("div");
    col.classList.add("last-trick-col");

    const name = document.createElement("p");
    name.classList.add("player-name-wrapper");
    name.textContent = player.getName();
    col.appendChild(name);

    const cardImg = document.createElement("img");
    cardImg.classList.add("last-trick-card");
    cardImg.src = `/images/svg-cards/${card.rank}${card.suit}.svg`;
    col.appendChild(cardImg);

    row.appendChild(col);
  });

  overlay.appendChild(row);
  container.appendChild(overlay);
}

export function renderMoonShotButtons(shooterPlayer, garySpecialMessage) {
  clearPlayPassUI();

  const playPassUI = document.getElementById("play-pass-ui");
  if (!playPassUI) return;

  const playerNameEl = document.createElement("div");
  playerNameEl.textContent = shooterPlayer.getName();
  playerNameEl.classList.add("moon-player-name");
  playPassUI.appendChild(playerNameEl);

  const moonEl = document.createElement("img");
  moonEl.src = moonImg;
  moonEl.alt = "Full Moon";
  moonEl.classList.add("moon-image");
  playPassUI.appendChild(moonEl);

  const arrowContainer = document.createElement("div");
  arrowContainer.classList.add("moon-arrow-container");

  const upArrowWrapper = document.createElement("div");
  upArrowWrapper.classList.add("moon-arrow-wrapper", "up-arrow-tooltip");
  upArrowWrapper.dataset.tooltip = garySpecialMessage
    ? "Just once? Hear the lion with you roar? How will you even know how it feels..."
    : "Push everyone else up 26 points";

  const downArrowWrapper = document.createElement("div");
  downArrowWrapper.classList.add("moon-arrow-wrapper", "down-arrow-tooltip");
  downArrowWrapper.dataset.tooltip = "You go down 26 points";

  const upArrow = document.createElement("img");
  upArrow.src = upArrowImg;
  upArrow.alt = "Add 26 to opponents";
  upArrow.classList.add("moon-arrow", "up-arrow");
  upArrow.addEventListener("click", () =>
    controller.dispatch("moonShot", { direction: "up" })
  );

  const downArrow = document.createElement("img");
  downArrow.src = downArrowImg;
  downArrow.alt = "You go down 26";
  downArrow.classList.add("moon-arrow", "down-arrow");
  downArrow.addEventListener("click", () =>
    controller.dispatch("moonShot", { direction: "down" })
  );

  upArrowWrapper.appendChild(upArrow);
  downArrowWrapper.appendChild(downArrow);
  arrowContainer.appendChild(upArrowWrapper);
  arrowContainer.appendChild(downArrowWrapper);

  playPassUI.appendChild(arrowContainer);
}

export function renderGameWinner(players, winnerIndex) {
  clearPlayPassUI();

  const playPassUI = document.getElementById("play-pass-ui");
  if (!playPassUI) return;

  const winner = players[winnerIndex];

  const wrapper = document.createElement("div");
  wrapper.className = "winner-overlay";

  const card = document.createElement("div");
  card.className = "winner-card";

  const title = document.createElement("div");
  title.className = "winner-title";
  title.textContent = "Game Over";

  const name = document.createElement("div");
  name.className = "winner-name";
  name.textContent = winner.getName();

  const subtitle = document.createElement("div");
  subtitle.className = "winner-subtitle";
  subtitle.textContent = "DOMINATES";

  card.appendChild(title);
  card.appendChild(name);
  card.appendChild(subtitle);
  wrapper.appendChild(card);
  playPassUI.appendChild(wrapper);
}

export function renderGameTie(players, tieIndexes) {
  clearPlayPassUI();

  const playPassUI = document.getElementById("play-pass-ui");
  if (!playPassUI) return;

  const wrapper = document.createElement("div");
  wrapper.className = "winner-overlay";

  const card = document.createElement("div");
  card.className = "winner-card";

  const title = document.createElement("div");
  title.className = "winner-title";
  title.textContent = "Game Over";

  const name = document.createElement("div");
  name.className = "winner-name";

  // Build a nice tie display like "Alice, Bob, & Carol"
  const tieNames = tieIndexes
    .map((index) => players[index].getName())
    .join(" & ");

  name.textContent = tieNames;

  const subtitle = document.createElement("div");
  subtitle.className = "winner-subtitle";
  subtitle.textContent = "are Co-Winners";

  card.appendChild(title);
  card.appendChild(name);
  card.appendChild(subtitle);
  wrapper.appendChild(card);
  playPassUI.appendChild(wrapper);
}

export function renderNewGameBtn() {
  const container = document.getElementById("new-game-container");
  if (!container) return;

  clearElementById("new-game-container");

  const newGameBtn = document.createElement("button");
  newGameBtn.classList.add("new-game-btn");
  newGameBtn.innerText = "Start a New Game";

  newGameBtn.addEventListener("click", () => {
    controller.dispatch("newGame");
  });

  container.appendChild(newGameBtn);
}

export function clearNewGameBtn() {
  clearElementById("new-game-container");
}

