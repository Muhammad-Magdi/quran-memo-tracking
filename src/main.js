import "./types.js";
import { createAppState } from "./state.js";
import { loadQuads, saveQuads } from "./storage.js";
import { setupApp } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const state = createAppState();
  state.quads = loadQuads();
  saveQuads(state.quads);
  setupApp(state);
});
