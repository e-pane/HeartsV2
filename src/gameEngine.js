import { createDeck, createHand, shuffle, createTrick } from "./factories.js";

export function createGameEngine(players) {
  let _deck = [];
  let _dealCounter = 0;
  let _players = players;
  let _tricksTaken = [0, 0, 0, 0];
  let _scores = [0, 0, 0, 0];
  let _currentPhase = "waiting";
  let _lastPlay = null;
  let _cardsPlayed = [];
  let _heartsBroken = false;

  const engine = Object.create(null);

  // Deal hands to players and rotate deal order
  engine.dealHands = () => {
    _deck = createDeck();
    shuffle(_deck);

    const rotatedPlayers = [
      ..._players.slice(_dealCounter),
      ..._players.slice(0, _dealCounter),
    ];

    for (let i = 0; i < 4; i++) {
      const cards = _deck.splice(0, 13);
      const hand = createHand(cards);
      hand.sort();
      rotatedPlayers[i].setHand(hand);
    }

    _dealCounter = (_dealCounter + 1) % 4;
    _currentPhase = "pass";

    _heartsBroken = false;

    return rotatedPlayers; // optional for UI rendering
  };

  engine.getCurrentPhase = () => _currentPhase;
  engine.setCurrentPhase = (phase) => {
    _currentPhase = phase;
  };
  engine.getPlayers = () => _players.slice();

  let _selectedCardsForPass = [];

  engine.addCardForPass = (card) => {
    if (!_selectedCardsForPass.includes(card)) {
      _selectedCardsForPass.push(card);
      _players[0].getHand().removeCard(card);
    }
  };

  engine.getSelectedCardsForPass = () => _selectedCardsForPass.slice();

  engine.removeCardForPass = (card) => {
    _selectedCardsForPass = _selectedCardsForPass.filter(
      (c) => c.rank !== card.rank || c.suit !== card.suit
    );
  };

  engine.passSelectedCards = () => {
    if (_selectedCardsForPass.length !== 3)
      throw new Error("Must pass exactly 3 cards");

    _players.forEach((p, idx) => {
      console.log(
        `Player ${idx + 1} hand before pass:`,
        p
          .getHand()
          .getCards()
          .map((c) => c.rank + c.suit)
      );
    });

    const player1Cards = _selectedCardsForPass;

    // Players 2–4: take first 3 cards
    const player2Cards = _players[1].getHand().getCards().slice(0, 3);
    const player3Cards = _players[2].getHand().getCards().slice(0, 3);
    const player4Cards = _players[3].getHand().getCards().slice(0, 3);

    const cardsToPass = [
      player1Cards,
      player2Cards,
      player3Cards,
      player4Cards,
    ];

    _players.forEach((player, idx) => {
      const hand = player.getHand();
      cardsToPass[idx].forEach((card) => hand.removeCard(card));
    });

    const passOrder = [
      _players[1], // Player1 → Player2
      _players[2], // Player2 → Player3
      _players[3], // Player3 → Player4
      _players[0], // Player4 → Player1
    ];

    passOrder.forEach((toPlayer, idx) => {
      const hand = toPlayer.getHand();
      cardsToPass[idx].forEach((card) => hand.addCard(card));
      hand.sort(); // optional: keep hand tidy
    });

    _players.forEach((p, idx) => {
      console.log(
        `Player ${idx + 1} hand after pass:`,
        p
          .getHand()
          .getCards()
          .map((c) => c.rank + c.suit)
      );
    });

    _selectedCardsForPass.length = 0;
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

  engine.getCurrentPlayer = () => _players[_currentPlayerIndex];

  engine.setCurrentPlayer = (player) => {
    _currentPlayerIndex = players.indexOf(player);
  }

  engine.getCurrentPlayerIndex = () => _currentPlayerIndex;

  engine.isFirstTrick = () =>
    _currentTrick.getPlays().length === 0 && _currentPhase === "play";

  engine.startPlayPhase = () => {
    _currentPhase = "play";

    const leadPlayerIndex = getPlayerWith2C();
    _currentPlayerIndex = leadPlayerIndex >= 0 ? leadPlayerIndex : 0;

    _currentTrick = createTrick(_players[_currentPlayerIndex], 1);
  };

  engine.playCard = (player, card) => {
    if (!engine.canPlayCard(player, card)) return false;

    _lastPlay = null;
    // Remove the card safely (mutate in place)
    player.getHand().removeCard(card);
    card._inTrick = true;
    card._faceUp = true;
    _currentTrick.addPlay(player, card);;
    _cardsPlayed.push(card);

    if (
      !_heartsBroken &&
      (card.suit === "H" || (card.suit === "S" && card.rank === "Q"))
    ) {
      _heartsBroken = true;
    }

    if (_currentTrick.getPlays().length === 4) {
      _currentPhase = "trick-complete";
      _lastPlay = null; // trick is locked
    } else {
      engine.advanceTurn(); // this clears undo
    }

    _lastPlay = { player, card, playerIndex: _currentPlayerIndex };

    return true;
  };

  engine.canPlayCard = (player, card) => {
    if (_players[_currentPlayerIndex] !== player) return false;

    const hand = player.getHand();
    const cardsInHand = hand.getCards();

    const heartsBroken = _heartsBroken;

    // corner case of player only having hearts and QS in their hand
    const onlyHeartsOrQS = cardsInHand.every(
      (c) => c.suit === "H" || (c.suit === "S" && c.rank === "Q")
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
      const ledSuit = _currentTrick.getPlays()[0].card.suit;
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
      if (card.suit === "H" && !heartsBroken) return false;

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

  engine.areHeartsBroken = () => _heartsBroken;

  engine.canUndo = () => _lastPlay !== null;

  engine.getLastPlay = () => _lastPlay;

  engine.undoLastPlay = () => {
    if (!_lastPlay) return false;

    const { player, card, playerIndex } = _lastPlay;

    const undone = _currentTrick.undoLastPlay();

    if (!undone) throw new Error("Nothing to undo");

    if (undone.player !== player || undone.card !== card) {
      throw new Error("Undo state mismatch");
    }
    player.getHand().addCard(card);
    player.getHand().sort();
    _currentPlayerIndex = playerIndex;

    _lastPlay = null;

    return { player, card };
  };

  engine.isTrickComplete = () => _currentPhase === "trick-complete";

  engine.advanceTurn = () => {
    _currentPlayerIndex = (_currentPlayerIndex + 1) % _players.length;
  };

  engine.completeTrick = () => {
    if (_currentTrick.getPlays().length !== 4) {
      throw new Error("Cannot complete trick: trick is not full");
    }

    const ledSuit = _currentTrick.getPlays()[0].card.suit;

    let winningEntry = _currentTrick.getPlays()[0];
    _currentTrick.getPlays().forEach((entry) => {
      if (
        entry.card.suit === ledSuit &&
        entry.card.rank > winningEntry.card.rank
      ) {
        winningEntry = entry;
      }
    });

    const winnerIndex = _players.indexOf(winningEntry.player);

    let trickPoints = 0;
    _currentTrick.getPlays().forEach(({ card }) => {
      if (card.suit === "H") trickPoints += 1;
      if (card.rank === "Q" && card.suit === "S") trickPoints += 13;
    });

    _scores[winnerIndex] += trickPoints;
    _tricksTaken[winnerIndex] += 1;

    _currentTrick = createTrick(
      _players[winnerIndex],
      _currentTrick.getTrickNumber() + 1
    );
    _currentPlayerIndex = winnerIndex;
    _currentPhase = "play";
    _lastPlay = null; // undo window resets

    return winningEntry.player;
  };

  engine.isHandComplete = () => {
    // If _currentTrick hasn't been created yet, hand isn't complete
    if (!_currentTrick) return false;

    // Hand is complete after trick #13
    return _currentTrick.getTrickNumber() > 13;
  };

  engine.getScores = () => _scores.slice();

  engine.getTricksTaken = () => _tricksTaken.slice();

  engine.getCurrentTrick = () => _currentTrick;

  return engine;
}



