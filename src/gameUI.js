
export function highlightCurrentPlayer(playerIndex) {
  const highlightGlow = "glow-highlight-pulse";

  // Remove glow from all containers
  document.querySelectorAll(".glow-container").forEach((el) => {
    el.classList.remove(highlightGlow);
  });

  // Add glow to current player’s container
  const containers = ["glow1", "glow2", "glow3", "glow4"];
  const el = document.getElementById(containers[playerIndex]);
  if (el) el.classList.add(highlightGlow);
  else console.log("No element found for index:", playerIndex);
}

export function renderHand(player, onCardClick) {
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

      cardEl.addEventListener("click", () => onCardClick(player, card));

      handContainer.appendChild(cardEl);
    });
}

export function renderOpponentHands(onOpponentClick) {
  const cardBackPath = "/images/svg-cards/1B.svg";

  const opponents = [
    { handId: "hand2", orientation: "horizontal", playerIndex: 1 },
    { handId: "hand3", orientation: "vertical", playerIndex: 2 },
    { handId: "hand4", orientation: "horizontal", playerIndex: 3 },
  ];

  opponents.forEach(({ handId, orientation, playerIndex }) => {
    const container = document.getElementById(handId);
    if (!container) return;

    // Stateless redraw
    container.innerHTML = "";

    const img = document.createElement("img");
    img.src = cardBackPath;
    img.classList.add("card", "opponent-card", orientation);
    img.style.cursor = "pointer";

    img.addEventListener("click", () => {
      onOpponentClick(playerIndex);
    });

    container.appendChild(img);
  });
}

export function renderPlayedCard(player, card, players, onUndoCard, undoable = false) {
  console.log("renderPlayedCard", card.rank + card.suit, "undoable:", undoable);
  const playerIndex = players.indexOf(player);
  if (playerIndex === -1) return;

  moveCardToPlayArea(playerIndex, card, onUndoCard, player, undoable);
}
export function moveCardToPlayArea(playerIndex, card, onUndoCard, player, undoable = false) {
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

  if (onUndoCard && undoable) {
    img.addEventListener("click", () => {
      onUndoCard(player, card); // notify controller
    });
  }

  slot.appendChild(img);
}
