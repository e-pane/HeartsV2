import "./login.css";
import { friends } from "../server/friends.js";
import tree1 from "./images/Tree1.png";
import tree2 from "./images/Tree2.png";
import tree3 from "./images/Tree3.png";
import tree4 from "./images/Tree4.png";
import brokenHeart from "./images/broken-heart.png";
import lastTrick from "./images/last-trick.png";
import stanfordLogo from "./images/stanford-logo.png";
import cardTable from "./images/card-table.jpg";

const optionsList = document.querySelector(".custom-select-options");
const selectButton = document.querySelector(".custom-select-btn");
const hiddenInput = document.querySelector("#player-name-hidden");
const selectWrapper = document.querySelector(".custom-select-wrapper");
const loginForm = document.querySelector("#login-form");
const accessCodeInput = document.querySelector("#access-code");
const errorMsg = document.querySelector("#error-msg");

function toggleSelectButton() {
  optionsList.classList.toggle("hidden");
}

selectButton.addEventListener("click", toggleSelectButton);

optionsList.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    const playerName = event.target.textContent;
    selectButton.textContent = playerName;
    hiddenInput.value = playerName;
    optionsList.classList.add("hidden");
  }
});

document.addEventListener("click", (event) => {
  if (!selectWrapper.contains(event.target)) {
    optionsList.classList.add("hidden");
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const playerName = hiddenInput.value.trim();
  const accessCode = accessCodeInput.value.trim().toLowerCase();
  
  if (friends.includes(playerName)) {
    if (accessCode === "nascar") {
      const loggedPlayers = JSON.parse(localStorage.getItem("players")) || [];

      if (loggedPlayers.includes(playerName)) {
        errorMsg.textContent = `${playerName} has already joined!"`;
        errorMsg.classList.remove("hidden");
        return;
      }

      loggedPlayers.push(playerName);
      localStorage.setItem("players", JSON.stringify(loggedPlayers));
      
      window.location.href = "index.html";
    }
    
    else {
      errorMsg.textContent = "Login failed - Gourdhead";
      errorMsg.classList.remove("hidden");
    }
  }
});

const imgTree1 = document.querySelector(".tree1");
const imgTree2 = document.querySelector(".tree2");
const imgTree3 = document.querySelector(".tree3");
const imgTree4 = document.querySelector(".tree4");
const imgBrokenHeart = document.querySelector(".broken-heart");
const imgLastTrick = document.querySelector(".last-trick");

imgTree1.src = tree1;
imgTree2.src = tree2;
imgTree3.src = tree3;
imgTree4.src = tree4;
imgBrokenHeart.src = brokenHeart;
imgLastTrick.src = lastTrick;

document.querySelector(".login-container").style.backgroundImage = `url(${cardTable})`;
document.querySelector(".logo").style.backgroundImage = `url(${stanfordLogo})`;

