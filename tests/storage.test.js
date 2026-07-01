import { describe, expect, it } from "bun:test";
import { STORAGE_KEYS } from "../src/constants.js";
import { loadQuads, saveQuads } from "../src/storage.js";

function createStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("storage helpers", () => {
  it("falls back to initialized quads when stored JSON is corrupt", () => {
    const storage = createStorage({ [STORAGE_KEYS.QUADS]: "not json" });

    const quads = loadQuads(storage);

    expect(quads).toHaveLength(240);
    expect(quads[0]).toEqual({ id: 1, name: "", reads: [] });
  });

  it("saves quads using the existing localStorage key", () => {
    const storage = createStorage();
    const quads = [{ id: 1, name: "الفاتحة", reads: [] }];

    saveQuads(quads, storage);

    expect(storage.getItem(STORAGE_KEYS.QUADS)).toBe(JSON.stringify(quads));
  });
});
