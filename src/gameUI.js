import { controller } from "./index.js";

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
export function renderPlayHand(player) {
  const handContainer = document.querySelector(".bottom-lower");
  if (!handContainer) return;

  handContainer.innerHTML = "";
  player
    .getHand()
    .getCards()
    .forEach((card) => {
      const cardEl = document.createElement("img");
      cardEl.src = `/images/svg-cards/${card.svg}`;
      cardEl.className = "card";
      cardEl.dataset.rank = card.rank;
      cardEl.dataset.suit = card.suit;

      cardEl.addEventListener("click", () => {
        controller.dispatch("playCard", { player, card });
      });
      handContainer.appendChild(cardEl);
    });
}
// allow a click on the card back of any opponent to send play card intent to dispatch
export function renderOpponentHands(players) {
  const cardBackPath = "/images/svg-cards/1B.svg";

  const opponents = [
    { handId: "hand2", orientation: "horizontal", playerIndex: 1 },
    { handId: "hand3", orientation: "vertical", playerIndex: 2 },
    { handId: "hand4", orientation: "horizontal", playerIndex: 3 },
  ];

  opponents.forEach(({ handId, orientation, playerIndex }) => {
    const container = document.getElementById(handId);
    if (!container) return;

    container.innerHTML = "";

    const opponent = players[playerIndex];
    if (!opponent) return;

    const img = document.createElement("img");
    img.src = cardBackPath;
    img.classList.add("card", "opponent-card", orientation);
    img.style.cursor = "pointer";

    img.addEventListener("click", () => {
      controller.dispatch("playCard", { player: opponent });
    });

    container.appendChild(img);
  });
}
// allow a click on any played card to send undo play intent to dispatch
export function renderPlayedCard(player, card, { playerIndex, undoable }) {
  const slotIds = ["played1", "played2", "played3", "played4"];
  const slot = document.getElementById(slotIds[playerIndex]);
  if (!slot) return;

  slot.innerHTML = "";

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
  const slot = document.getElementById(slotIds[playerIndex]);
  if (slot) slot.innerHTML = "";
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

  slotIds.forEach((id) => {
    const slot = document.getElementById(id);
    if (slot) {
      slot.innerHTML = "";
    }
  });
}
export function renderHeartsBrokenMsg({ heartsBroken, trickNumber, plays }) {
  const container = document.getElementById("play-pass-ui");
  container.innerHTML = ""; // clear any previous overlay

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
  container.innerHTML = ""; // clear any previous overlay

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

export function clearPlayPassUI() {
  const container = document.getElementById("play-pass-ui");
  container.innerHTML = "";
}

// export function renderNewGameUI() {}
