import { controller } from "./index.js";
import { removeById } from "./rendererHelpers.js";

export function renderPassUI(passDirection) {
  clearPassUI();

  const messageContainer = document.getElementById("pass-message-container");
  if (!messageContainer) return;

  const message = document.createElement("p");
  message.id = "pass-message";
  
  if (passDirection === "left")
    message.textContent = "Pick 3 cards to pass to the left";
  else if (passDirection === "right")
    message.textContent = "Pick 3 cards to pass to the right";
  else if (passDirection === "across")
    message.textContent = "Pick 3 cards to pass across";
  else if (passDirection === "keep") message.textContent = "This is indeed a keeper.  You might be boned";

  messageContainer.appendChild(message);

  if (passDirection === "keep") return;

  const passUI = document.getElementById("play-pass-ui");
  if (!passUI) return;

  const passSlotsContainer = document.createElement("div");
  passSlotsContainer.id = "pass-slots";
  passSlotsContainer.className = "pass-slots-container";

  for (let i = 0; i < 3; i++) {
    const slot = document.createElement("div");
    slot.className = "pass-slot";
    passSlotsContainer.appendChild(slot);
  }

  passUI.appendChild(passSlotsContainer);
}

export function clearPassUI() {
  const passUI = document.getElementById("play-pass-ui");
  if (!passUI) return;

  // Remove pass message if it exists
  removeById("pass-message");

  // Remove pass slots container if it exists
  removeById("pass-slots");
}
// allows click to send confirm pass (enter play phase) intent to dispatch
export function renderPassBtn() {
  const passUI = document.getElementById("play-pass-ui");
  if (!passUI) return;

  if (document.querySelector(".pass-btn")) return;

  const passBtn = document.createElement("button");
  passBtn.classList.add("pass-btn");
  passBtn.innerText = "Pass";

  passBtn.addEventListener("click", () => {
    controller.dispatch("confirmPass");
  });

  passUI.appendChild(passBtn);
}

export function removePassBtn() {
  const btn = document.querySelector(".pass-btn");
  if (btn) btn.remove();
}

export function renderPassError(message) {
  clearPassError();

  const container = document.getElementById("pass-message-container");
  if (!container) return;

  const p = document.createElement("p");
  p.id = "pass-error";
  p.textContent = message;
  p.style.color = "red";
  p.style.fontWeight = "bold";

  container.appendChild(p);
}

export function clearPassError() {
  removeById("pass-error");
}
// allows click on card in pass slot to send undo pass intent to dispatch
export function renderCardInPassSlot(playerIndex, card) {
  const slots = document.querySelectorAll(".pass-slot");

  const emptySlot = Array.from(slots).find(
    (slot) => !slot.querySelector("img")
  );
  if (!emptySlot) {
    return;
  }

  const img = document.createElement("img");
  img.src = `/images/svg-cards/${card.svg}`;
  img.className = "card-slot-image";
  img.dataset.rank = card.rank;
  img.dataset.suit = card.suit;
  img._cardRef = card;

  img.addEventListener("click", () => {
    controller.dispatch("undoPass", { playerIndex, card });
  });

  emptySlot.appendChild(img);
}

export function renderPassSlotUndo(card) {
  const slots = document.querySelectorAll(".pass-slot");

  slots.forEach((slot) => {
    const cardImg = slot.querySelector("img");
    if (!cardImg) return; // nothing to undo
    if (cardImg._cardRef === card) {
      cardImg.remove();
    }
  });
}
// allow click on any pass hand card to send pass card intent to dispatch
export function renderPassHand(playerIndex, cards) {
  const handContainer = document.getElementById("player-hand");
  if (!handContainer) return;

  handContainer.innerHTML = "";
  cards.forEach((card) => {
    const cardEl = document.createElement("img");
    cardEl.src = `/images/svg-cards/${card.svg}`;
    cardEl.className = "card";
    cardEl.dataset.rank = card.rank;
    cardEl.dataset.suit = card.suit;

    cardEl.addEventListener("click", () => {
      controller.dispatch("passCard", { playerIndex, card });
    });
    handContainer.appendChild(cardEl);
  });
}
