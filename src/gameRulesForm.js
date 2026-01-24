// this script will run on the html to customize rules and UI themes

const rawRuleInputs = {
    endScore: Number(endScoreInput.value),
    allowUndo: undoCheckbox.checked,
    showLastTrick: lastTrickCheckbox.checked,
    showHeartsBroken: heartsBrokenCheckbox.checked,
    moonRule: moonRuleSelect.value || "standard",
    rolloverAt100: rolloverCheckbox.checked,
    allowBreakHeartsFirstTrick: breakFirstTrickCheckbox.checked,
    queenSpadesCountsAsHeart: qsHeartCheckbox.checked,
    omnibus: omnibusCheckbox.checked,
    blackMaria: blackMariaCheckbox.checked,
};
