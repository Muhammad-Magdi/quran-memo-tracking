import { describe, expect, it } from "bun:test";
import {
  addReadToQuad,
  calculateStatistics,
  createInitialQuads,
  generateHeatMapData,
  getHeatMapLevel,
  getRecentReads,
  searchQuads,
} from "../src/domain.js";

describe("domain helpers", () => {
  it("initializes the configured number of quads", () => {
    const quads = createInitialQuads(3);

    expect(quads).toEqual([
      { id: 1, name: "", reads: [] },
      { id: 2, name: "", reads: [] },
      { id: 3, name: "", reads: [] },
    ]);
  });

  it("searches by quad number and name", () => {
    const quads = createInitialQuads(3);
    quads[0].name = "الفاتحة";

    expect(searchQuads(quads, "1")).toHaveLength(1);
    expect(searchQuads(quads, "الفاتحة")).toHaveLength(1);
  });

  it("adds reads newest first without changing other quads", () => {
    let quads = createInitialQuads(2);
    quads = addReadToQuad(quads, 1, "book", new Date("2026-01-01T10:00:00.000Z"));
    quads = addReadToQuad(quads, 1, "heart", new Date("2026-01-02T10:00:00.000Z"));

    expect(quads[0].reads.map((read) => read.type)).toEqual(["heart", "book"]);
    expect(quads[1].reads).toEqual([]);
  });

  it("filters recent reads by type and limits results", () => {
    let quads = createInitialQuads(3);
    quads = addReadToQuad(quads, 1, "book", new Date("2026-01-01T10:00:00.000Z"));
    quads = addReadToQuad(quads, 2, "heart", new Date("2026-01-03T10:00:00.000Z"));
    quads = addReadToQuad(quads, 3, "heart", new Date("2026-01-02T10:00:00.000Z"));

    const recentReads = getRecentReads(quads, { type: "heart" }, 1);

    expect(recentReads).toEqual([
      {
        quadId: 2,
        quadName: "",
        latestReadType: "heart",
        latestReadDate: "2026-01-03T10:00:00.000Z",
      },
    ]);
  });

  it("calculates aggregate statistics", () => {
    let quads = createInitialQuads(2);
    quads[0].name = "الفاتحة";
    quads = addReadToQuad(quads, 1, "book", new Date("2026-01-01T10:00:00.000Z"));
    quads = addReadToQuad(quads, 1, "heart", new Date("2026-01-01T12:00:00.000Z"));

    expect(calculateStatistics(quads, 2)).toMatchObject({
      totalReads: 2,
      bookReads: 1,
      heartReads: 1,
      readQuads: 1,
      namedQuads: 1,
      activeDays: 1,
      completionPercentage: "50.0",
      averageReadsPerDay: "2.0",
    });
  });

  it("maps heatmap counts to levels", () => {
    expect([0, 1, 2, 4, 6].map(getHeatMapLevel)).toEqual([0, 1, 2, 3, 4]);
  });

  it("generates heatmap days with counts", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const target = new Date(now);
    target.setDate(target.getDate() - 365);

    const heatMap = generateHeatMapData({ [target.toDateString()]: 2 }, now);

    expect(heatMap.weeks[0][0]).toMatchObject({
      count: 2,
      level: 2,
    });
  });
});
