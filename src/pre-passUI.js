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

export function renderPlayerNames(players) {
  if (players.length < 4) return;

  const mapping = {
    0: "player1", // bottom
    1: "player2", // middle-left
    2: "player3", // top
    3: "player4", // middle-right
  };

  players.forEach((player, index) => {
    const el = document.getElementById(mapping[index]);
    if (el) el.textContent = `${player.getName()} - Tricks: 0`; // tricks placeholder
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

export function renderDealBtn(onDealConfirmed) {
  const container = document.querySelector(".middle-center");
  if (!container) return;

  // Avoid creating multiple buttons
  if (document.querySelector(".deal-btn")) return;

  const dealBtn = document.createElement("button");
  dealBtn.classList.add("deal-btn");
  dealBtn.innerText = "Deal";

  dealBtn.addEventListener("click", () => {
    onDealConfirmed(); // ← the escape hatch
    dealBtn.remove();
  });

  container.appendChild(dealBtn);
}