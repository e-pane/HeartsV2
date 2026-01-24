// this script will run on the html that collects user customizations

// set default UI themes
export const defaultUITheme = {
  buttonColor: "#0A4C8C",
  cardBack: "blue-stripes",
  playerAvatarStyle: "classic",
  cardFaceStyle: "classic",
  tableLogo: "default-logo.png",
};

// merge default and user input UI themes in an objec to pass to game factory
export function buildUIThemeFromInput(input) {
  return {
    ...defaultUITheme,
    ...input,
  };
}
