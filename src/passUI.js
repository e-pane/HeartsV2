export function renderPassUI() {
  clearPassUI();

  const messageContainer = document.getElementById("pass-message-container");
  if (!messageContainer) return;

  const message = document.createElement("p");
  message.id = "pass-message";
  message.textContent = "Pick 3 cards to pass to the left";
  messageContainer.appendChild(message);

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
  const msg = document.getElementById("pass-message");
  if (msg) msg.remove();

  // Remove pass slots container if it exists
  const slots = document.getElementById("pass-slots");
  if (slots) slots.remove();
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
  const err = document.getElementById("pass-error");
  if (err) err.remove();
}

export function enablePassSlotUndo(onUndo) {
  const slots = document.querySelectorAll(".pass-slot");

  slots.forEach((slot) => {
    slot.addEventListener("click", () => {
      const cardImg = slot.querySelector("img");
      if (!cardImg) return; // nothing to undo

      const card = cardImg._cardRef;

      // Remove from slot visually
      cardImg.remove();

      // Call the callback with the card object
      if (typeof onUndo === "function") onUndo(card);
    });
  });
}

export function renderPassBtn(onPassConfirmed) {
  const passUI = document.getElementById("play-pass-ui");
  if (!passUI) return;

  if (document.querySelector(".pass-btn")) return;

  const passBtn = document.createElement("button");
  passBtn.classList.add("pass-btn");
  passBtn.innerText = "Pass";

  passBtn.addEventListener("click", () => {
    onPassConfirmed(); // ← THIS runs the block above
  });

  passUI.appendChild(passBtn);
}

export function renderCardInPassSlot(card) {
  const slots = document.querySelectorAll(".pass-slot");
  const emptySlot = Array.from(slots).find(
    (slot) => !slot.querySelector("img")
  );
  if (!emptySlot) return;

  const img = document.createElement("img");
  img.src = `/images/svg-cards/${card.svg}`;
  img.className = "card-slot-image";
  img.dataset.rank = card.rank;
  img.dataset.suit = card.suit;
  img._cardRef = card;

  emptySlot.appendChild(img);
}