/**
 * @typedef {"book" | "heart"} ReadType
 */

/**
 * @typedef {Object} ReadRecord
 * @property {ReadType} type
 * @property {string} date ISO timestamp.
 */

/**
 * @typedef {Object} Quad
 * @property {number} id
 * @property {string} name
 * @property {ReadRecord[]} reads
 */

/**
 * @typedef {Object} RecentRead
 * @property {number} quadId
 * @property {string} quadName
 * @property {ReadType} latestReadType
 * @property {string} latestReadDate
 */

/**
 * @typedef {Object} Statistics
 * @property {number} totalReads
 * @property {number} bookReads
 * @property {number} heartReads
 * @property {number} readQuads
 * @property {number} heartQuads
 * @property {number} namedQuads
 * @property {number} activeDays
 * @property {number} weekReads
 * @property {number} monthReads
 * @property {string} completionPercentage
 * @property {string} memorizationPercentage
 * @property {string} bookPercent
 * @property {string} heartPercent
 * @property {string} averageReadsPerDay
 * @property {{current: number, longest: number}} streaks
 * @property {{id: number, name: string, count: number}} mostReadQuad
 * @property {Record<string, number>} readsByDate
 */

/**
 * @typedef {Object} HeatMapDay
 * @property {string} dateKey
 * @property {string} date
 * @property {number} count
 * @property {number} level
 */

/**
 * @typedef {Object} HeatMapData
 * @property {HeatMapDay[][]} weeks
 */

export {};
