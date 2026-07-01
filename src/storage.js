import { STORAGE_KEYS, TOTAL_QUADS } from "./constants.js";
import { createInitialQuads, normalizeQuads } from "./domain.js";

export function loadQuads(storage = localStorage) {
  const storedQuads = storage.getItem(STORAGE_KEYS.QUADS);

  if (!storedQuads) {
    return createInitialQuads(TOTAL_QUADS);
  }

  try {
    return normalizeQuads(JSON.parse(storedQuads), TOTAL_QUADS);
  } catch {
    return createInitialQuads(TOTAL_QUADS);
  }
}

export function saveQuads(quads, storage = localStorage) {
  storage.setItem(STORAGE_KEYS.QUADS, JSON.stringify(quads));
}

export function hasCompletedTutorial(storage = localStorage) {
  return storage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED) === "true";
}

export function markTutorialCompleted(storage = localStorage) {
  storage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, "true");
}
