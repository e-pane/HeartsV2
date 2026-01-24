// this script will run on the html that collects user customizations

// set default game rules
export const defaultGameRules = {
  endScore: 100,
  allowUndo: true,
  showLastTrick: true,
  showHeartsBroken: true,
  moonRule: "standard",
  rolloverAt100: false,
  allowBreakHeartsFirstTrick: false,
  queenSpadesCountsAsHeart: false,
  omnibus: false,
  blackMaria: false,
};

// merge customized rule inputs with defaults in an object to pass to game factory
export function buildRulesFromInput(input) {
  return {
    ...defaultGameRules,
    ...input,
  };
}
