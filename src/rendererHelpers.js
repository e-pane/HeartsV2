export function removeById(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

export function clearElementById(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = "";
}

export function clearPlayPassUI() {
  clearElementById("play-pass-ui");
}
