import { createDeck, createHand, shuffle, createTrick } from "./factories.js";
import { calculateGameOver } from "./engineHelpers.js";

export function createGameEngine(players) {
  let _deck = [];
  let _dealCounter = 0;
  let _players = players;
  let _tricks = [];
  let _tricksTaken = [0, 0, 0, 0];
  let _currentPhase = "waiting";
  let _passDirection = "left";
  let _selectedCardsForPass = [[], [], [], []];
  let _lastPlay = null;
  let _cardsPlayed = [];
  let _heartsBroken = false;
  let _heartsBrokenTrick = null;
  let _lastTrick = null;
  let _turnSuspended = false;
  let _handOver = false;
  let _moonShot = false;
  let _moonShooterIndex = null;
  let _garySpecialMessage = false;
  let _gameWinnerIndex = null;
  let _gameTied = false;
  let _gameTieIndexes = null;
  let _gameOver = false;

  const engine = Object.create(null);

  // return initial game state to the first handler to get started
  engine.getState = () => {
    const handsByPlayerIndex = {};
    _players.forEach((player, idx) => {
      handsByPlayerIndex[idx] = player.getHand();
    });

    return {
      success: true,
      players: _players,
      tricksTaken: _tricksTaken,
      handsByPlayerIndex,
      heartsBroken: _heartsBroken,
      heartsBrokenTrick: _heartsBrokenTrick,
      currentTrick: _currentTrick,
      lastTrick: _lastTrick,
      currentPhase: _currentPhase,
    };
  };

  // Deal hands to players and rotate deal order
  engine.dealHands = () => {
    // defensive state resets
    _heartsBroken = false;
    _moonShot = false;
    _moonShooterIndex = null;
    _garySpecialMessage = false;
    _lastTrick = null;
    _tricks = [];
    _tricksTaken = [0, 0, 0, 0];
    _turnSuspended = false;
    _lastPlay = null;

    _deck = createDeck();
    shuffle(_deck);

    const rotatedPlayers = [
      ..._players.slice(_dealCounter),
      ..._players.slice(0, _dealCounter),
    ];

    const handsByPlayerIndex = {};

    for (let i = 0; i < 4; i++) {
      const cards = _deck.splice(0, 13);
      const hand = createHand(cards);
      hand.sort();
      rotatedPlayers[i].setHand(hand);
      let realPlayerIndex = (i + _dealCounter) % 4;
      handsByPlayerIndex[realPlayerIndex] = hand;
    }

    const passCycle = ["left", "right", "across", "keep"];
    _passDirection = passCycle[_dealCounter % 4];
    
    _currentPhase = _passDirection === "keep" ? "play" : "pass";
    
    _dealCounter = (_dealCounter + 1) % 4;

    if (_currentPhase === "play") {
      const leadPlayerIndex = getPlayerWith2C();
      _currentPlayerIndex = leadPlayerIndex >= 0 ? leadPlayerIndex : 0;
      _currentTrick = createTrick(_players[_currentPlayerIndex], 1);
    } else {
      _currentPlayerIndex = null;
      _currentTrick = null;
    }

    return {
      success: true,
      passDirection: _passDirection,
      currentPhase: _currentPhase,
      currentPlayerIndex: _currentPlayerIndex,
      currentTrick: _currentTrick,
      handsByPlayerIndex,
    }
  };
  
  engine.getPlayers = () => _players.slice();

  engine.addCardForPass = (playerIndex, card) => {
    if (_currentPhase !== "pass") {
      return { success: false, error: "not in pass phase" };
    }

    const selected = _selectedCardsForPass[playerIndex];

    if (selected.length === 3) {
      return { success: false, error: "too many cards selected" }; 
    }

    const isSameCard = (a, b) => a.rank === b.rank && a.suit === b.suit;
    if (selected.some(c => isSameCard(c, card))) {
      return { success: false, error: "already selected" };
    }

    selected.push(card);

    const currentPlayer = _players[playerIndex];
    currentPlayer.getHand().removeCard(card);
    currentPlayer.getHand().sort();

    return {
      success: true,
      currentPhase: _currentPhase,
      selectedCardsForPass: [...selected],
      playerHand: currentPlayer.getHand(),
    };
  };

  engine.removeCardForPass = (playerIndex, card) => {
    if (_currentPhase !== "pass") {
      return {
        success: false,
        error: "Not in pass phase",
        currentPhase: _currentPhase,
      };
    }
    const updated = _selectedCardsForPass[playerIndex].filter(
      (c) => c.rank !== card.rank || c.suit !== card.suit,
    );

    _selectedCardsForPass[playerIndex] = updated;
    const currentPlayer = _players[playerIndex];
    currentPlayer.getHand().addCard(card);
    currentPlayer.getHand().sort();

    return {
      success: true,
      currentPhase: _currentPhase,
      selectedCardsForPass: [...updated],
      playerHand: currentPlayer.getHand(),
    };
  };

  engine.passSelectedCards = () => {
    // Single-client mode: only player 0 selects cards.
    // In multiplayer, replace this guard with an "all players ready" check.
    if (_selectedCardsForPass[0].length !== 3) {
      return { success: false, error: "pass not ready" };
    }

    const result = {
      success: true,
      currentPhase: "play",
      passDirection: _passDirection,
      currentPlayerIndex: null,
      currentTrick: null,
      handsByPlayerIndex: {},
    };

    if (_passDirection === "keep") {
      _selectedCardsForPass = [[], [], [], []];

      const { handsByPlayerIndex } = engine.getState();
      result.handsByPlayerIndex = { ...handsByPlayerIndex };

      return result; // <--- still one return object
    }

    const cardsToPass = [
      _selectedCardsForPass[0], // player 0 selections
      _players[1].getHand().getCards().slice(0, 3), // mocked opponent
      _players[2].getHand().getCards().slice(0, 3), // mocked opponent
      _players[3].getHand().getCards().slice(0, 3), // mocked opponent
    ];

    _players.forEach((player, idx) => {
      const hand = player.getHand();
      cardsToPass[idx].forEach((card) => hand.removeCard(card));
    });

    let passOrder;
    if (_passDirection === "left") {
      passOrder = [
        _players[1], // P1 → P2
        _players[2], // P2 → P3
        _players[3], // P3 → P4
        _players[0], // P4 → P1
      ];
    } else if (_passDirection === "right") {
      passOrder = [
        _players[3], // P1 → P4
        _players[0], // P4 → P3
        _players[1], // P3 → P2
        _players[2], // P2 → P1
      ];
    } else if (_passDirection === "across") {
      passOrder = [
        _players[2], // P1 → P3
        _players[3], // P2 → P4
        _players[0], // P3 → P1
        _players[1], // P4 → P2
      ];
    }

    passOrder.forEach((toPlayer, idx) => {
      const hand = toPlayer.getHand();
      cardsToPass[idx].forEach((card) => hand.addCard(card));
      hand.sort(); // optional: keep hand tidy
    });

    _currentPhase = "play";

    const leadPlayerIndex = getPlayerWith2C();
    _currentPlayerIndex = leadPlayerIndex >= 0 ? leadPlayerIndex : 0;
    _currentTrick = createTrick(_players[_currentPlayerIndex], 1);

    result.currentPlayerIndex = _currentPlayerIndex;
    result.currentTrick = _currentTrick;

    const { handsByPlayerIndex } = engine.getState();
    result.handsByPlayerIndex = { ...handsByPlayerIndex };

    _selectedCardsForPass = [[], [], [], []];

    return result;
  };

  let _currentTrick = null;
  let _currentPlayerIndex = 0;

  const getPlayerWith2C = () => {

    for (let i = 0; i < _players.length; i++) {
      const hand = _players[i].getHand().getCards();

      const has2C = hand.some((c) => c.rank === 2 && c.suit === "C");

      if (has2C) {
        return i;
      }
    }
    return -1;
  };

  engine.getLeadPlayer = () => {
    if (engine.isFirstTrick()) {
      // On first trick, lead player is whoever has 2♣
      const idx = getPlayerWith2C();
      return idx >= 0 ? _players[idx] : null;
    }

    // For other tricks, the lead player is the first card in the current trick
    if (_currentTrick && _currentTrick.getCards().length > 0) {
      return _currentTrick.getLeadPlayer();
    }

    // If current trick is empty (new trick), the current player is the lead
    return _players[_currentPlayerIndex];
  };

  engine.isFirstTrick = () => _currentTrick.getTrickNumber() === 1;

  engine.playCard = (playerIndex, card) => {
    const player = _players[playerIndex];
    if (_currentTrick.getPlays().length === 4) {
      return { success: false, error: "trick is over" };
    }
    if (_turnSuspended) {
      return { success: false, error: "turn suspended" };
    }
    if (!engine.canPlayCard(playerIndex, card)) {
      return { success: false, error: "that card can't be played" };
    }
    _lastPlay = null;

    player.getHand().removeCard(card);
    card._inTrick = true;
    card._faceUp = true;
    _currentTrick.addPlay(player, card);;
    _cardsPlayed.push(card);

    if (_currentTrick.getPlays().length === 4) {
      _turnSuspended = true;
    }

    const preHeartsBroken = _heartsBroken;
    const preHeartsBrokenTrick = _heartsBrokenTrick;

    if (
      !_heartsBroken &&
      (card.suit === "H" || (card.suit === "S" && card.rank === "Q"))
    ) {
      _heartsBroken = true;
      _heartsBrokenTrick = _currentTrick;
    }

    _lastPlay = {
      player,
      card,
      playerIndex: _currentPlayerIndex,
      preHeartsBroken,
      preHeartsBrokenTrick,
    };

    engine.advanceTurn(); 

    return {
      success: true,
      currentPhase: _currentPhase,
      currentPlayerIndex: _currentPlayerIndex,
      lastPlay: _lastPlay,
      currentTrick: _currentTrick,
    };
  };

  engine.getFirstPlayableCard = (playerIndex) => {
    const hand = _players[playerIndex].getHand().getCards();

    for (const card of hand) {
      if (engine.canPlayCard(playerIndex, card)) {
        return { success: true, card };
      }
    }

    return { success: false, error: "No playable card found" };
  };

  engine.canPlayCard = (playerIndex, card) => {
    const player = _players[playerIndex];
    console.assert(
      _players.includes(player),
      "Player identity mismatch — possible recreation bug",
      player,
      _players,
    );
    if (_players[_currentPlayerIndex] !== player) return false;

    const hand = player.getHand();
    const cardsInHand = hand.getCards();

    const heartsBroken = _heartsBroken;

    // corner case of player only having hearts and QS in their hand
    const onlyHeartsOrQS = cardsInHand.every(
      (c) => c.suit === "H" || (c.suit === "S" && c.rank === "Q"),
    );

    if (engine.isFirstTrick()) {
      const leadPlayerIndex = getPlayerWith2C();

      // Lead player on first trick
      if (_currentPlayerIndex === leadPlayerIndex) {
        // Corner case overrides 2♣ requirement
        if (onlyHeartsOrQS) return true;

        // Normal rule: must lead 2♣
        return card.rank === 2 && card.suit === "C";
      }

      // Non-lead players on first trick
      const trickPlays = _currentTrick.getPlays();
      const ledSuit = trickPlays.length > 0 ? trickPlays[0].card.suit : null;
      const hasLedSuit = cardsInHand.some((c) => c.suit === ledSuit);

      // Must follow suit if possible
      if (hasLedSuit && card.suit !== ledSuit) return false;

      // Corner case overrides heart/QS restriction
      if (onlyHeartsOrQS) return true;

      // Otherwise: no hearts or QS on first trick
      if (card.suit === "H") return false;
      if (card.suit === "S" && card.rank === "Q") return false;

      return true;
    }

    const trickPlays = _currentTrick.getPlays();
    const isLeading = trickPlays.length === 0;

    // Lead player logic
    if (isLeading) {
      // Corner case overrides breaking rules
      if (onlyHeartsOrQS) return true;

      // Cannot lead hearts until broken
      if (
        (card.suit === "H" && !heartsBroken) ||
        (card.suit === "S" && card.rank === "Q" && !heartsBroken)
      ) {
        return false;
      }

      return true;
    }

    // Non-lead player logic
    const ledSuit = trickPlays[0].card.suit;
    const hasLedSuit = cardsInHand.some((c) => c.suit === ledSuit);

    // Must follow suit if possible
    if (hasLedSuit && card.suit !== ledSuit) return false;

    // Otherwise can dump anything (breaking hearts / QS allowed)
    return true;
  };

  engine.undoLastPlay = () => {
    if (!_lastPlay) {
      return { success: false, error: "this card play can't be undone" };
    }

    if (_currentPhase !== "play") {
      return { success: false, error: "cannot undo outside of play phase" };
    }

    const { player, card, playerIndex } = _lastPlay;

    const undone = _currentTrick.undoLastPlay();

    if (!undone) {
      return { success: false, error: "Nothing to undo" };
    }

    if (undone.player !== player || undone.card !== card) {
      return { success: false, error: "Undo state mismatch" };
    }

    player.getHand().addCard(card);
    player.getHand().sort();

    _turnSuspended = false;
    _currentPlayerIndex = playerIndex; 

    _heartsBroken = _lastPlay.preHeartsBroken;
    _heartsBrokenTrick = _lastPlay.preHeartsBrokenTrick;

    _lastPlay = null;

    return {
      success: true,
      currentPhase: _currentPhase,
      currentPlayerIndex: _currentPlayerIndex,
      undonePlay: { playerIndex, card },
    };
  };

  engine.canUndo = () => _lastPlay !== null;

  // just bumps the CPI up by one with each successful play
  engine.advanceTurn = () => {
    _currentPlayerIndex = (_currentPlayerIndex + 1) % _players.length;

    return {
      success: true,
      currentPlayerIndex: _currentPlayerIndex,
    };
  };

  const rankValue = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  function compareCardRanks(cardA, cardB) {
    return rankValue[cardA.rank] - rankValue[cardB.rank];
  }

  engine.completeTrick = () => {
    if (_currentTrick.getPlays().length !== 4) {
      return { success: false, error: "trick is not over yet" };
    }

    _turnSuspended = true;
    const ledSuit = _currentTrick.getPlays()[0].card.suit;

    let winningEntry = _currentTrick.getPlays()[0];
    _currentTrick.getPlays().forEach((entry) => {
      if (
        entry.card.suit === ledSuit &&
        compareCardRanks(entry.card, winningEntry.card) > 0)
       {
        winningEntry = entry;
      }
    });

    const winnerIndex = _players.indexOf(winningEntry.player);

    let trickPoints = 0;
    _currentTrick.getPlays().forEach(({ card }) => {
      if (card.suit === "H") trickPoints += 1;
      if (card.rank === "Q" && card.suit === "S") trickPoints += 13;
    });

    _tricksTaken[winnerIndex] += 1;

    _lastTrick = _currentTrick;

    _players[winnerIndex].addTrick(_currentTrick);

    _tricks.push(_currentTrick);

    if (_tricks.length === 13) {
      _handOver = true;
      _currentPhase = "hand_resolution";
    } else {
      _currentPhase = "play"; // <— keep phase consistent
    }

    _currentTrick = createTrick(
      _players[winnerIndex],
      _currentTrick.getTrickNumber() + 1
    );
    _currentPlayerIndex = winnerIndex;
    _turnSuspended = false;
    _lastPlay = null; 

    return {
      success: true,
      winnerIndex,
      currentPhase: _currentPhase,
      currentPlayerIndex: _currentPlayerIndex,
      currentTrick: _currentTrick,
      lastTrick: _lastTrick,
      tricksTaken: [..._tricksTaken],
      handOver: _handOver,
    };
  };
// scoped helper for the 3 scoring methods below
  function setPhaseAfterScoring() {
    _currentPhase = _gameOver ? "gameOver" : "deal";
  }
// another scoped helper for the 3 scoring methods below
  function resetHandState() {
    _players.forEach((player) => {
      player.setHand([]);
      player.setTricks([]);
    });

    _tricksTaken = [0, 0, 0, 0];
    _tricks = [];
    _lastTrick = null;
    _heartsBroken = false;
    _currentTrick = null;
    _currentPlayerIndex = 0;
  }
// another scoped helper for the scoring methods below
  function updateGameOverAndPhase(scores) {
    const gameOverResult = calculateGameOver(scores);

    _gameOver = gameOverResult.gameOver;
    _gameTied = gameOverResult.gameTied;
    _gameWinnerIndex = gameOverResult.winnerIndex;
    _gameTieIndexes = gameOverResult.tieIndexes;

    setPhaseAfterScoring();
  }
// another scoped helper for the scoring methods below
  function getScores() {
    return _players.map((p) => p.getScore());
  }

  engine.finishHand = () => {
    _moonShot = false;
    _moonShooterIndex = null;
    _handOver = false;
    // calculate scores for each player
    _players.forEach((player, index) => {     
        const tricksTaken = player.getTricks();
        let handPoints = 0;
        tricksTaken.forEach(trick => {
            trick.getPlays().forEach(({card}) => {
                if (card.suit === "H") handPoints += 1;
                if (card.suit === "S" && card.rank === "Q") handPoints += 13;
            });
        });
      
      if (handPoints === 26) {
        _moonShot = true;
        _moonShooterIndex = index;
        
          if (_players[_moonShooterIndex].getName() === "G") {
            const scores = _players.map((p) => p.getScore());
            const gScore = _players[_moonShooterIndex].getScore();
    
            // sort scores ascending
            const sortedScores = [...scores].sort((a, b) => a - b);
            const gRank = sortedScores.indexOf(gScore);
    
            const someoneAt74Plus = _players.some(
              (p) => p !== _players[_moonShooterIndex] && p.getScore() >= 74
            );
    
            const someoneStillBelowGaryAfterPush = _players.some(
              (p) => p !== _players[_moonShooterIndex] && p.getScore() + 26 < gScore
            );
    
            if (
              (gRank === 1 || gRank === 2) &&
              someoneAt74Plus &&
              someoneStillBelowGaryAfterPush
            ) {
              _garySpecialMessage = true;
            }
          }
        }
      else {
        player.incrementScore(handPoints);
      }
    });

    const scores = getScores();
    updateGameOverAndPhase(scores);

    resetHandState();

    return {
      success: true,
      moonShot: _moonShot,
      moonShooterIndex: _moonShooterIndex,
      garySpecialMessage: _garySpecialMessage,
      currentPhase: _currentPhase,
      currentScores: scores,
      tricksTaken: _tricksTaken,
      gameTied: _gameTied, // ← explicit
      winnerIndex: _gameWinnerIndex, // number | null
      tieIndexes: _gameTieIndexes ?? null,
    };
  };

  engine.moonShot = () => _moonShot;

  engine.getMoonShooterIndex = () => _moonShooterIndex;

  engine.everyoneUp26 = () => {
    const shooterIndex = engine.getMoonShooterIndex();

    if (shooterIndex === null || shooterIndex === undefined) {
      return { success: false, error: "No moon shooter set" };
    }

    _players.forEach((player, index) => {
      if (index !== shooterIndex) {
        player.incrementScore(26);
      }
    });

    const scores = getScores();
    updateGameOverAndPhase(scores);

    return {
      success: true,
      updatedScores: scores,
      currentPhase: _currentPhase,
      gameTied: _gameTied,
      winnerIndex: _gameWinnerIndex,
      tieIndexes: _gameTieIndexes ?? null,
    };
  };

  engine.shooterDown26 = () => {
    const shooterIndex = engine.getMoonShooterIndex();

    if (shooterIndex === null || shooterIndex === undefined) {
      return { success: false, error: "No moon shooter set" };
    }

    _players.forEach((player, index) => {
      if (index === shooterIndex) {
        player.incrementScore(-26);
      }
    });

    const scores = getScores();
    updateGameOverAndPhase(scores);

    return {
      success: true,
      updatedScores: scores,
      currentPhase: _currentPhase,
      gameTied: _gameTied,
      winnerIndex: _gameWinnerIndex,
      tieIndexes: _gameTieIndexes ?? null,
    };
  };

  return engine;
}



