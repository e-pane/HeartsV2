import { controller } from "./index.js";

export function renderWaitingMessage() {
  const container = document.querySelector(".middle-center"); // or a dedicated message div
  if (!container) return;

  // Clear any existing message first
  const existingMsg = document.getElementById("waiting-message");
  if (existingMsg) existingMsg.remove();

  const p = document.createElement("p");
  p.id = "waiting-message";
  p.textContent = "Waiting for all players to join...";
  container.appendChild(p);
}

export function removeWaitingMessage() {
  const existingMsg = document.getElementById("waiting-message");
  if (existingMsg) existingMsg.remove();
}

export function renderPlayerNames(players, tricksTaken) {
  if (players.length < 4) return;

  const mapping = {
    0: "player1", // bottom
    1: "player2", // middle-left
    2: "player3", // top
    3: "player4", // middle-right
  };

  players.forEach((player, index) => {
    const el = document.getElementById(mapping[index]);
    if (!el) return;

    el.textContent = `${player.getName()} - Tricks: ${tricksTaken[index]}`;
  });
}

export function renderPlayerNamesInScoreTable(players) {
  players.forEach((player, index) => {
    const th = document.querySelector(
      `.score-table th:nth-child(${index + 1})`
    );
    if (th) th.textContent = player.getName();
  });
}
// allows click on dealBtn to send deal hand (enter pass phase) intent to dispatch
export function renderDealBtn() {
  const container = document.querySelector(".middle-center");
  if (!container) return;

  // Avoid creating multiple buttons
  if (document.querySelector(".deal-btn")) return;

  const dealBtn = document.createElement("button");
  dealBtn.classList.add("deal-btn");
  dealBtn.innerText = "Deal";

  dealBtn.addEventListener("click", () => {
    controller.dispatch("confirmDeal", {});
    dealBtn.remove();
  });

  container.appendChild(dealBtn);
}
// allows click on HeartsBrokenBtn to send render heartsBroken intent to handler
export function wireHeartsBrokenBtn() {
  const btn = document.querySelector(".broken-heart");
  if (!btn) return;

  btn.addEventListener("click", () => {
    controller.dispatch("showHeartsBrokenMsg", { action: "show" });
  });
}
// allows click on LastTrickBtn to send render lastTrick intent to handler
export function wireLastTrickBtn() {
  const btn = document.querySelector(".last-trick");
  if (!btn) return;

  btn.addEventListener("click", () => {
    controller.dispatch("showLastTrick", { action: "show" });
  });
}
