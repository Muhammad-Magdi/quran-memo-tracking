import { READ_TYPES, TOTAL_QUADS, TUTORIAL_SLIDE_COUNT } from "./constants.js";
import {
  addReadToQuad,
  calculateStatistics,
  findQuadBySearchTerm,
  generateHeatMapData,
  getQuadsOrderedByLatestRead,
  getRecentReads,
  searchQuads,
  updateQuadName,
} from "./domain.js";
import { resetCurrentQuadId, setCurrentQuadId, setCurrentSlide } from "./state.js";
import { hasCompletedTutorial, markTutorialCompleted, saveQuads } from "./storage.js";
import { clearElement, createElement, formatDate, formatDateShort, setHidden } from "./utils.js";

const heatMapTooltips = new WeakMap();

export function setupApp(state) {
  const refs = getRefs();

  setupEventListeners(state, refs);
  renderRecentReads(state, refs);

  if (!hasCompletedTutorial()) {
    showWelcomeModal(refs);
  }
}

function getRefs() {
  return {
    tabs: document.querySelectorAll(".tab"),
    tabContents: document.querySelectorAll(".tab-content"),
    historyTab: document.getElementById("history"),
    quadDetailTab: document.getElementById("quad-detail"),
    backToGridButton: document.getElementById("back-to-grid-btn"),
    quadSearch: document.getElementById("quad-search"),
    searchResults: document.getElementById("search-results"),
    searchError: document.getElementById("search-error"),
    readTypeBook: document.getElementById("read-type-book"),
    readTypeHeart: document.getElementById("read-type-heart"),
    filterDate: document.getElementById("filter-date"),
    filterType: document.getElementById("filter-type"),
    filterQuad: document.getElementById("filter-quad"),
    recentReadsList: document.getElementById("recent-reads-list"),
    quadsGrid: document.getElementById("quads-grid"),
    detailQuadTitle: document.getElementById("detail-quad-title"),
    editNameButton: document.getElementById("edit-name-btn"),
    editNameForm: document.getElementById("edit-name-form"),
    newQuadName: document.getElementById("new-quad-name"),
    saveNameButton: document.getElementById("save-name-btn"),
    cancelEditButton: document.getElementById("cancel-edit-btn"),
    quadReadsList: document.getElementById("quad-reads-list"),
    statsContent: document.getElementById("stats-content"),
    welcomeModal: document.getElementById("welcome-modal"),
    nextSlideButton: document.getElementById("next-slide"),
    prevSlideButton: document.getElementById("prev-slide"),
    skipTutorialButton: document.getElementById("skip-tutorial"),
    finishTutorialButton: document.getElementById("finish-tutorial"),
    tutorialSlides: document.querySelectorAll(".tutorial-slide"),
    tutorialDots: document.querySelectorAll(".dot"),
  };
}

function setupEventListeners(state, refs) {
  refs.tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(state, refs, tab.dataset.tab));
  });

  refs.backToGridButton.addEventListener("click", () => {
    setHidden(refs.historyTab, false);
    refs.historyTab.classList.add("active");
    refs.quadDetailTab.classList.remove("active");
    renderQuadsGrid(state, refs);
  });

  refs.quadSearch.addEventListener("input", () => renderSearchResults(state, refs));

  refs.readTypeBook.addEventListener("click", () => addReadRecord(state, refs, READ_TYPES.BOOK));
  refs.readTypeHeart.addEventListener("click", () => addReadRecord(state, refs, READ_TYPES.HEART));

  refs.filterDate.addEventListener("change", () => renderRecentReads(state, refs));
  refs.filterType.addEventListener("change", () => renderRecentReads(state, refs));
  refs.filterQuad.addEventListener("input", () => renderRecentReads(state, refs));

  refs.editNameButton.addEventListener("click", () => showEditNameForm(state, refs));
  refs.saveNameButton.addEventListener("click", () => saveQuadName(state, refs));
  refs.cancelEditButton.addEventListener("click", () => hideEditNameForm(refs));

  refs.searchResults.addEventListener("click", (event) => {
    const result = event.target.closest("[data-quad-id]");

    if (!result) {
      return;
    }

    const quadId = Number.parseInt(result.dataset.quadId, 10);
    const quad = state.quads.find((item) => item.id === quadId);

    if (!quad) {
      return;
    }

    refs.quadSearch.value = quad.name || quad.id;
    setCurrentQuadId(state, quad.id);
    clearElement(refs.searchResults);
  });

  refs.recentReadsList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-quad-id]");

    if (item) {
      showQuadHistory(state, refs, Number.parseInt(item.dataset.quadId, 10));
    }
  });

  refs.quadsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quad-id]");

    if (button) {
      showQuadDetail(state, refs, Number.parseInt(button.dataset.quadId, 10));
    }
  });

  refs.statsContent.addEventListener("mouseenter", showHeatMapTooltip, true);
  refs.statsContent.addEventListener("mouseleave", hideHeatMapTooltip, true);

  refs.nextSlideButton.addEventListener("click", () => moveTutorialSlide(state, refs, 1));
  refs.prevSlideButton.addEventListener("click", () => moveTutorialSlide(state, refs, -1));
  refs.skipTutorialButton.addEventListener("click", () => completeTutorial(refs));
  refs.finishTutorialButton.addEventListener("click", () => completeTutorial(refs));
}

function activateTab(state, refs, tabId) {
  refs.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabId));
  refs.tabContents.forEach((content) => content.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");

  if (tabId === "history") {
    renderQuadsGrid(state, refs);
  }

  if (tabId === "stats") {
    renderStatistics(state, refs);
  }
}

function setReadType(refs, type) {
  refs.readTypeBook.classList.remove("selected", "book", "heart");
  refs.readTypeHeart.classList.remove("selected", "book", "heart");

  if (type === READ_TYPES.BOOK) {
    refs.readTypeBook.classList.add("selected", "book");
  } else {
    refs.readTypeHeart.classList.add("selected", "heart");
  }
}

function renderSearchResults(state, refs) {
  const searchTerm = refs.quadSearch.value.trim();
  clearElement(refs.searchResults);

  if (!searchTerm) {
    return;
  }

  const results = searchQuads(state.quads, searchTerm);

  if (results.length === 0) {
    refs.searchResults.append(
      createElement("div", { className: "search-empty", text: "لا توجد نتائج" })
    );
    return;
  }

  results.forEach((quad) => {
    const resultItem = createElement("button", {
      className: "read-item search-result-item",
      dataset: { quadId: quad.id },
    });
    resultItem.type = "button";

    resultItem.append(
      createElement("span", { className: "quad-name", text: quad.name || "ربع بدون اسم" }),
      createElement("span", { className: "quad-number", text: `الربع رقم: ${quad.id}` })
    );

    refs.searchResults.append(resultItem);
  });
}

function showError(refs, message) {
  refs.searchError.textContent = message;
  setHidden(refs.searchError, false);

  setTimeout(() => {
    setHidden(refs.searchError, true);
  }, 5000);
}

function addReadRecord(state, refs, readType) {
  setReadType(refs, readType);

  const searchTerm = refs.quadSearch.value.trim();

  if (!searchTerm) {
    showError(refs, "يرجى اختيار ربع أولاً");
    return;
  }

  const quad =
    state.currentQuadId !== null
      ? state.quads.find((item) => item.id === state.currentQuadId)
      : findQuadBySearchTerm(state.quads, searchTerm);

  if (!quad) {
    showError(refs, "لم يتم العثور على الربع. يرجى التأكد من الرقم أو الاسم");
    return;
  }

  state.quads = addReadToQuad(state.quads, quad.id, readType);
  saveQuads(state.quads);

  refs.quadSearch.value = "";
  resetCurrentQuadId(state);
  clearElement(refs.searchResults);
  setHidden(refs.searchError, true);

  renderRecentReads(state, refs);

  if (refs.historyTab.classList.contains("active")) {
    renderQuadsGrid(state, refs);
  }

  if (document.getElementById("stats").classList.contains("active")) {
    renderStatistics(state, refs);
  }

  showSuccessMessage(`✓ تم إضافة التلاوة بنجاح! (الربع ${quad.id})`);
}

function showSuccessMessage(message) {
  const successMsg = createElement("div", { className: "success-toast", text: message });
  document.body.appendChild(successMsg);

  setTimeout(() => {
    successMsg.classList.add("is-leaving");
    setTimeout(() => successMsg.remove(), 300);
  }, 2500);
}

function renderRecentReads(state, refs) {
  clearElement(refs.recentReadsList);

  const recentReads = getRecentReads(state.quads, {
    date: refs.filterDate.value,
    type: refs.filterType.value,
    quad: refs.filterQuad.value,
  });

  if (recentReads.length === 0) {
    refs.recentReadsList.append(
      createEmptyState("📚", "لا توجد تلاوات", "ابدأ بإضافة أول تلاوة باستخدام النموذج أعلاه!")
    );
    return;
  }

  recentReads.forEach((quad) => {
    refs.recentReadsList.append(renderRecentReadItem(quad));
  });
}

function renderRecentReadItem(quad) {
  const item = createElement("button", {
    className: `read-item ${quad.latestReadType}`,
    dataset: { quadId: quad.quadId },
  });
  item.type = "button";

  const readMeta = createElement("span", { className: "read-meta" });
  readMeta.append(
    createElement("span", {
      className: "read-type",
      text: quad.latestReadType === READ_TYPES.BOOK ? "قراءة" : "تسميع",
    }),
    createElement("span", { className: "quad-number", text: `الربع رقم: ${quad.quadId}` })
  );

  item.append(
    createElement("span", {
      className: "quad-name",
      text: quad.quadName || `الربع ${quad.quadId}`,
    }),
    readMeta,
    createElement("span", { className: "read-date", text: formatDate(quad.latestReadDate) })
  );

  return item;
}

function renderQuadsGrid(state, refs) {
  clearElement(refs.quadsGrid);

  getQuadsOrderedByLatestRead(state.quads).forEach((quad) => {
    const button = createElement("button", {
      className: `quad-button ${quad.reads.length > 0 ? "has-reads" : ""}`,
      dataset: { quadId: quad.id },
    });
    button.type = "button";

    button.append(createElement("span", { className: "quad-number", text: `الربع ${quad.id}` }));

    if (quad.name) {
      button.append(createElement("span", { className: "quad-name-display", text: quad.name }));
    }

    const readCounts = createElement("span", { className: "read-counts" });
    readCounts.append(
      createElement("span", { className: "count-book", text: `${quad.counts.book} - قراءة` }),
      createElement("span", { className: "count-heart", text: `${quad.counts.heart} - تسميع` })
    );

    button.append(
      readCounts,
      createElement("span", {
        className: "last-read-date",
        text: quad.latestRead ? formatDateShort(quad.latestRead) : "لا يوجد تلاوة",
      })
    );

    refs.quadsGrid.append(button);
  });
}

function showQuadDetail(state, refs, quadId) {
  setCurrentQuadId(state, quadId);
  refs.historyTab.classList.remove("active");
  refs.quadDetailTab.classList.add("active");
  renderQuadHistory(state, refs);
}

function showQuadHistory(state, refs, quadId) {
  refs.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "history"));
  refs.tabContents.forEach((content) => content.classList.remove("active"));
  refs.historyTab.classList.add("active");
  renderQuadsGrid(state, refs);
  showQuadDetail(state, refs, quadId);
}

function renderQuadHistory(state, refs) {
  const quad = state.quads.find((item) => item.id === state.currentQuadId);
  clearElement(refs.quadReadsList);

  if (!quad) {
    refs.detailQuadTitle.textContent = "سجل تلاوة الربع";
    refs.quadReadsList.append(createElement("p", { text: "لم يتم العثور على هذا الربع" }));
    return;
  }

  refs.detailQuadTitle.textContent = `سجل تلاوة الربع ${quad.id}${quad.name ? ` - ${quad.name}` : ""}`;
  hideEditNameForm(refs);

  if (quad.reads.length === 0) {
    refs.quadReadsList.append(createElement("p", { text: "لا توجد تلاوات مسجلة لهذا الربع بعد" }));
    return;
  }

  quad.reads.forEach((read) => {
    const item = createElement("div", { className: `read-item ${read.type}` });
    item.append(
      createElement("span", {
        className: "read-type",
        text: read.type === READ_TYPES.BOOK ? "قراءة" : "تسميع",
      }),
      createElement("span", { className: "read-date", text: formatDate(read.date) })
    );
    refs.quadReadsList.append(item);
  });
}

function showEditNameForm(state, refs) {
  const quad = state.quads.find((item) => item.id === state.currentQuadId);
  refs.newQuadName.value = quad?.name ?? "";
  setHidden(refs.editNameForm, false);
}

function hideEditNameForm(refs) {
  setHidden(refs.editNameForm, true);
}

function saveQuadName(state, refs) {
  const newName = refs.newQuadName.value.trim();
  state.quads = updateQuadName(state.quads, state.currentQuadId, newName);
  saveQuads(state.quads);
  hideEditNameForm(refs);
  renderQuadHistory(state, refs);
  renderRecentReads(state, refs);
  renderQuadsGrid(state, refs);
}

function renderStatistics(state, refs) {
  const statistics = calculateStatistics(state.quads);
  const heatMapData = generateHeatMapData(statistics.readsByDate);
  clearElement(refs.statsContent);

  refs.statsContent.append(
    renderStatsCards(statistics),
    renderProgress(statistics.completionPercentage),
    renderSecondaryStats(statistics),
    renderHeatMap(heatMapData)
  );
}

function renderStatsCards(statistics) {
  const grid = createElement("div", { className: "stats-grid" });
  grid.append(
    createStatsCard("إجمالي التلاوات", statistics.totalReads, "primary"),
    createStatsCard("قراءة", statistics.bookReads, "book"),
    createStatsCard("تسميع", statistics.heartReads, "heart"),
    createStatsCard(`من ${TOTAL_QUADS} ربع`, statistics.readQuads, "warm")
  );
  return grid;
}

function createStatsCard(label, value, variant) {
  const card = createElement("div", { className: `stat-card stat-card-${variant}` });
  card.append(
    createElement("div", { className: "stat-card-value", text: value }),
    createElement("div", { className: "stat-card-label", text: label })
  );
  return card;
}

function renderProgress(completionPercentage) {
  const section = createElement("div", { className: "stats-panel" });
  const progressTrack = createElement("div", { className: "progress-track" });
  const progressBar = createElement("div", {
    className: "progress-bar",
    text: `${completionPercentage}%`,
  });
  progressBar.style.setProperty("--progress-width", `${completionPercentage}%`);

  progressTrack.append(progressBar);
  section.append(createElement("h3", { text: "نسبة الإتمام" }), progressTrack);
  return section;
}

function renderSecondaryStats(statistics) {
  const grid = createElement("div", { className: "secondary-stats-grid" });
  grid.append(
    createSecondaryStat("أرباع مسماة", statistics.namedQuads),
    createSecondaryStat("أيام النشاط", statistics.activeDays),
    createSecondaryStat("متوسط التلاوات/اليوم", statistics.averageReadsPerDay)
  );
  return grid;
}

function createSecondaryStat(label, value) {
  const stat = createElement("div", { className: "secondary-stat" });
  stat.append(
    createElement("div", { className: "secondary-stat-value", text: value }),
    createElement("div", { className: "secondary-stat-label", text: label })
  );
  return stat;
}

function renderHeatMap(heatMapData) {
  const section = createElement("div", { className: "stats-panel heatmap-panel" });
  const header = createElement("div", { className: "heatmap-header" });
  header.append(
    createElement("h3", { text: "خريطة النشاط" }),
    createElement("span", { className: "heatmap-range", text: "آخر 365 يوم" })
  );

  const container = createElement("div", { className: "heatmap-container" });
  heatMapData.weeks.forEach((week) => {
    const weekRow = createElement("div", { className: "heatmap-week" });
    week.forEach((day) => {
      const dayElement = createElement("span", {
        className: `heatmap-day heatmap-level-${day.level}`,
        dataset: {
          count: day.count,
          date: formatDateShort(day.date),
        },
      });
      dayElement.title = day.count > 0 ? `${day.count} تلاوة` : "لا يوجد نشاط";
      weekRow.append(dayElement);
    });
    container.append(weekRow);
  });

  section.append(header, container, renderHeatMapLegend());
  return section;
}

function renderHeatMapLegend() {
  const legend = createElement("div", { className: "heatmap-legend" });
  const swatches = createElement("div", { className: "heatmap-swatches" });

  for (let level = 0; level <= 4; level += 1) {
    swatches.append(createElement("span", { className: `heatmap-swatch heatmap-level-${level}` }));
  }

  legend.append(
    createElement("span", { text: "أقل" }),
    swatches,
    createElement("span", { text: "أكثر" })
  );
  return legend;
}

function showHeatMapTooltip(event) {
  const day = event.target.closest(".heatmap-day");

  if (!day || Number.parseInt(day.dataset.count, 10) === 0 || heatMapTooltips.has(day)) {
    return;
  }

  const tooltip = createElement("span", {
    className: "heatmap-tooltip",
    text: `${day.dataset.count} تلاوة في ${day.dataset.date}`,
  });
  day.append(tooltip);
  heatMapTooltips.set(day, tooltip);
}

function hideHeatMapTooltip(event) {
  const day = event.target.closest(".heatmap-day");
  const tooltip = day ? heatMapTooltips.get(day) : null;

  if (tooltip) {
    tooltip.remove();
    heatMapTooltips.delete(day);
  }
}

function showWelcomeModal(refs) {
  refs.welcomeModal.classList.add("active");
}

function hideWelcomeModal(refs) {
  refs.welcomeModal.classList.remove("active");
}

function moveTutorialSlide(state, refs, direction) {
  const nextSlide = state.currentSlide + direction;

  if (nextSlide < 0 || nextSlide >= TUTORIAL_SLIDE_COUNT) {
    return;
  }

  setCurrentSlide(state, nextSlide);
  updateTutorialSlide(refs, state.currentSlide);
}

function updateTutorialSlide(refs, currentSlide) {
  refs.tutorialSlides.forEach((slide, index) => {
    slide.classList.toggle("active", index === currentSlide);
  });
  refs.tutorialDots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });

  setHidden(refs.prevSlideButton, currentSlide === 0);
  setHidden(refs.nextSlideButton, currentSlide === TUTORIAL_SLIDE_COUNT - 1);
  setHidden(refs.skipTutorialButton, currentSlide === TUTORIAL_SLIDE_COUNT - 1);
  setHidden(refs.finishTutorialButton, currentSlide !== TUTORIAL_SLIDE_COUNT - 1);
}

function completeTutorial(refs) {
  markTutorialCompleted();
  hideWelcomeModal(refs);
}

function createEmptyState(icon, title, message) {
  const emptyState = createElement("div", { className: "empty-state" });
  emptyState.append(
    createElement("div", { className: "empty-state-icon", text: icon }),
    createElement("h3", { text: title }),
    createElement("p", { text: message })
  );
  return emptyState;
}
