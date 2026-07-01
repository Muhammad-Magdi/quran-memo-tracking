import { READ_TYPES, TOTAL_QUADS } from "./constants.js";

/**
 * @returns {import("./types.js").Quad[]}
 */
export function createInitialQuads(totalQuads = TOTAL_QUADS) {
  return Array.from({ length: totalQuads }, (_, index) => ({
    id: index + 1,
    name: "",
    reads: [],
  }));
}

export function normalizeQuads(value, totalQuads = TOTAL_QUADS) {
  if (!Array.isArray(value)) {
    return createInitialQuads(totalQuads);
  }

  const normalizedById = new Map();

  value.forEach((quad) => {
    if (!quad || !Number.isInteger(quad.id) || quad.id < 1 || quad.id > totalQuads) {
      return;
    }

    normalizedById.set(quad.id, {
      id: quad.id,
      name: typeof quad.name === "string" ? quad.name : "",
      reads: normalizeReads(quad.reads),
    });
  });

  return createInitialQuads(totalQuads).map((quad) => normalizedById.get(quad.id) ?? quad);
}

export function searchQuads(quads, searchTerm) {
  const term = searchTerm.trim().toLowerCase();

  if (!term) {
    return [];
  }

  return quads.filter(
    (quad) => quad.id.toString().includes(term) || quad.name.toLowerCase().includes(term)
  );
}

export function findQuadBySearchTerm(quads, searchTerm) {
  const term = searchTerm.trim().toLowerCase();

  if (!term) {
    return null;
  }

  return (
    quads.find((quad) => quad.id.toString() === term || quad.name.toLowerCase() === term) ?? null
  );
}

export function addReadToQuad(quads, quadId, readType, date = new Date()) {
  if (!isValidReadType(readType)) {
    throw new Error(`Unsupported read type: ${readType}`);
  }

  return quads.map((quad) => {
    if (quad.id !== quadId) {
      return quad;
    }

    return {
      ...quad,
      reads: [{ type: readType, date: date.toISOString() }, ...quad.reads],
    };
  });
}

export function updateQuadName(quads, quadId, name) {
  return quads.map((quad) => (quad.id === quadId ? { ...quad, name } : quad));
}

export function getRecentReads(quads, filters = {}, limit = 24) {
  let quadsWithLatestRead = quads
    .map((quad) => {
      const latestRead = quad.reads[0];

      if (!latestRead) {
        return null;
      }

      return {
        quadId: quad.id,
        quadName: quad.name,
        latestReadType: latestRead.type,
        latestReadDate: latestRead.date,
      };
    })
    .filter(Boolean);

  if (filters.date) {
    const filterDate = new Date(filters.date).toDateString();
    quadsWithLatestRead = quadsWithLatestRead.filter(
      (quad) => new Date(quad.latestReadDate).toDateString() === filterDate
    );
  }

  if (filters.type && filters.type !== "all") {
    quadsWithLatestRead = quadsWithLatestRead.filter(
      (quad) => quad.latestReadType === filters.type
    );
  }

  if (filters.quad) {
    const quadFilter = filters.quad.trim().toLowerCase();
    quadsWithLatestRead = quadsWithLatestRead.filter(
      (quad) =>
        quad.quadId.toString().includes(quadFilter) ||
        quad.quadName.toLowerCase().includes(quadFilter)
    );
  }

  return quadsWithLatestRead
    .sort((a, b) => new Date(b.latestReadDate) - new Date(a.latestReadDate))
    .slice(0, limit);
}

export function getQuadsOrderedByLatestRead(quads) {
  return [...quads]
    .map((quad) => ({
      ...quad,
      latestRead: quad.reads[0]?.date ?? null,
      counts: getReadCounts(quad),
    }))
    .sort((a, b) => {
      if (!a.latestRead && !b.latestRead) {
        return a.id - b.id;
      }

      if (!a.latestRead) {
        return 1;
      }

      if (!b.latestRead) {
        return -1;
      }

      return new Date(b.latestRead) - new Date(a.latestRead);
    });
}

export function getReadCounts(quad) {
  return {
    book: quad.reads.filter((read) => read.type === READ_TYPES.BOOK).length,
    heart: quad.reads.filter((read) => read.type === READ_TYPES.HEART).length,
  };
}

export function calculateStatistics(quads, totalQuads = TOTAL_QUADS) {
  const readsByDate = {};
  const totalDays = new Set();
  let totalReads = 0;
  let bookReads = 0;
  let heartReads = 0;
  let readQuads = 0;
  let namedQuads = 0;

  quads.forEach((quad) => {
    if (quad.reads.length > 0) {
      readQuads += 1;
    }

    if (quad.name) {
      namedQuads += 1;
    }

    quad.reads.forEach((read) => {
      totalReads += 1;

      if (read.type === READ_TYPES.BOOK) {
        bookReads += 1;
      }

      if (read.type === READ_TYPES.HEART) {
        heartReads += 1;
      }

      const date = new Date(read.date).toDateString();
      totalDays.add(date);
      readsByDate[date] = (readsByDate[date] ?? 0) + 1;
    });
  });

  return {
    totalReads,
    bookReads,
    heartReads,
    readQuads,
    namedQuads,
    activeDays: totalDays.size,
    completionPercentage: ((readQuads / totalQuads) * 100).toFixed(1),
    averageReadsPerDay: totalReads > 0 ? (totalReads / totalDays.size).toFixed(1) : "0",
    readsByDate,
  };
}

export function generateHeatMapData(readsByDate, now = new Date()) {
  const weeks = [];

  for (let week = 0; week < 53; week += 1) {
    const days = [];

    for (let day = 0; day < 7; day += 1) {
      const dateIndex = week * 7 + day;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - (365 - dateIndex));

      const dateKey = targetDate.toDateString();
      const count = readsByDate[dateKey] ?? 0;

      days.push({
        dateKey,
        date: targetDate.toISOString(),
        count,
        level: getHeatMapLevel(count),
      });
    }

    weeks.push(days);
  }

  return { weeks };
}

export function getHeatMapLevel(count) {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count === 2) {
    return 2;
  }

  if (count <= 5) {
    return 3;
  }

  return 4;
}

function normalizeReads(reads) {
  if (!Array.isArray(reads)) {
    return [];
  }

  return reads
    .filter((read) => {
      const parsedDate = new Date(read.date);
      return read && isValidReadType(read.type) && !Number.isNaN(parsedDate.getTime());
    })
    .map((read) => ({
      type: read.type,
      date: new Date(read.date).toISOString(),
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function isValidReadType(readType) {
  return readType === READ_TYPES.BOOK || readType === READ_TYPES.HEART;
}
