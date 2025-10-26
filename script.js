// Initialize data structure
let quads = [];
const totalQuads = 240;
let currentQuadId = null;

// Initialize the app
function initApp() {
  loadData();
  setupEventListeners();
  renderRecentReads();

  // Show welcome modal for first-time users
  if (!localStorage.getItem("tutorialCompleted")) {
    showWelcomeModal();
  }
}

// Load data from localStorage
function loadData() {
  const storedQuads = localStorage.getItem("quranQuads");
  if (storedQuads) {
    quads = JSON.parse(storedQuads);
  } else {
    // Initialize with empty quads
    for (let i = 1; i <= totalQuads; i++) {
      quads.push({
        id: i,
        name: "",
        reads: [],
      });
    }
    saveData();
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("quranQuads", JSON.stringify(quads));
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");

      // If switching to history tab, render the quads grid
      if (tab.dataset.tab === "history") {
        renderQuadsGrid();
      }
      // If switching to stats tab, render statistics
      if (tab.dataset.tab === "stats") {
        renderStatistics();
      }
    });
  });

  // Back to grid button
  document.getElementById("back-to-grid-btn").addEventListener("click", () => {
    document.getElementById("history").classList.add("active");
    document.getElementById("quad-detail").classList.remove("active");
    renderQuadsGrid();
  });

  // Search functionality
  document
    .getElementById("quad-search")
    .addEventListener("input", handleSearch);

  // Read type button handlers - directly add the record
  document.getElementById("read-type-book").addEventListener("click", () => {
    setReadType("book");
    addReadRecord("book");
  });
  document.getElementById("read-type-heart").addEventListener("click", () => {
    setReadType("heart");
    addReadRecord("heart");
  });

  // Filter functionality
  document
    .getElementById("filter-date")
    .addEventListener("change", renderRecentReads);
  document
    .getElementById("filter-type")
    .addEventListener("change", renderRecentReads);
  document
    .getElementById("filter-quad")
    .addEventListener("input", renderRecentReads);

  // Edit name functionality
  document
    .getElementById("edit-name-btn")
    .addEventListener("click", showEditNameForm);
  document
    .getElementById("save-name-btn")
    .addEventListener("click", saveQuadName);
  document
    .getElementById("cancel-edit-btn")
    .addEventListener("click", hideEditNameForm);

  // Welcome modal functionality
  if (document.getElementById("next-slide")) {
    document.getElementById("next-slide").addEventListener("click", nextSlide);
    document.getElementById("prev-slide").addEventListener("click", prevSlide);
    document
      .getElementById("skip-tutorial")
      .addEventListener("click", skipTutorial);
    document
      .getElementById("finish-tutorial")
      .addEventListener("click", finishTutorial);
  }
}

// Set read type and update button styles
function setReadType(type) {
  // Update button classes
  const bookBtn = document.getElementById("read-type-book");
  const heartBtn = document.getElementById("read-type-heart");

  // Remove all selection classes
  bookBtn.classList.remove("selected", "book", "heart");
  heartBtn.classList.remove("selected", "book", "heart");

  if (type === "book") {
    bookBtn.classList.add("selected", "book");
  } else {
    heartBtn.classList.add("selected", "heart");
  }
}

// Handle search for quads
function handleSearch(e) {
  const searchTerm = e.target.value.trim();
  const resultsContainer = document.getElementById("search-results");
  resultsContainer.innerHTML = "";

  if (searchTerm === "") return;

  const results = quads.filter((quad) => {
    return (
      quad.id.toString().includes(searchTerm) ||
      quad.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (results.length > 0) {
    results.forEach((quad) => {
      const resultItem = document.createElement("div");
      resultItem.className = "read-item";
      resultItem.innerHTML = `
                <div class="quad-name">${quad.name || "ربع بدون اسم"}</div>
                <div class="quad-number">الربع رقم: ${quad.id}</div>
            `;
      resultItem.addEventListener("click", () => {
        document.getElementById("quad-search").value = quad.name || quad.id;
        currentQuadId = quad.id;
        resultsContainer.innerHTML = "";
      });
      resultsContainer.appendChild(resultItem);
    });
  } else {
    resultsContainer.innerHTML = "<div>لا توجد نتائج</div>";
  }
}

// Show inline error message
function showError(message) {
  const errorDiv = document.getElementById("search-error");
  errorDiv.textContent = message;
  errorDiv.style.display = "flex";

  // Hide error after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// Add a new read record
function addReadRecord(readType) {
  const searchInput = document.getElementById("quad-search");
  const searchTerm = searchInput.value.trim();

  if (!searchTerm) {
    showError("يرجى اختيار ربع أولاً");
    return;
  }

  let quadId;

  // If we have a current quad ID from search, use it
  if (currentQuadId) {
    quadId = currentQuadId;
  } else {
    // Otherwise try to find the quad by ID or name
    const quad = quads.find(
      (q) =>
        q.id.toString() === searchTerm ||
        q.name.toLowerCase() === searchTerm.toLowerCase()
    );

    if (!quad) {
      showError("لم يتم العثور على الربع. يرجى التأكد من الرقم أو الاسم");
      return;
    }

    quadId = quad.id;
  }

  // Add the read record
  const newRead = {
    type: readType,
    date: new Date().toISOString(),
  };

  quads[quadId - 1].reads.unshift(newRead);
  saveData();

  // Reset form
  searchInput.value = "";
  currentQuadId = null;
  document.getElementById("search-results").innerHTML = "";
  document.getElementById("search-error").style.display = "none";

  // Update recent reads
  renderRecentReads();

  // Update quads grid if on history tab
  const historyTab = document.getElementById("history");
  if (historyTab?.classList.contains("active")) {
    renderQuadsGrid();
  }

  // Update statistics if on stats tab
  const statsTab = document.getElementById("stats");
  if (statsTab?.classList.contains("active")) {
    renderStatistics();
  }

  // Show success feedback
  showSuccessMessage(`✓ تم إضافة التلاوة بنجاح! (الربع ${quadId})`);
}

// Show success message
function showSuccessMessage(message) {
  const successMsg = document.createElement("div");
  successMsg.textContent = message;
  successMsg.style.cssText =
    "position: fixed; top: 30px; right: 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 22px 35px; border-radius: 16px; z-index: 1001; box-shadow: 0 10px 40px -5px rgba(16, 185, 129, 0.5); font-weight: 700; font-size: 16px; animation: slideIn 0.3s ease; max-width: 90%; text-align: center;";
  document.body.appendChild(successMsg);
  setTimeout(() => {
    successMsg.style.animation = "slideOut 0.3s ease";
    setTimeout(() => successMsg.remove(), 300);
  }, 2500);
}

// Render recent reads with filters
function renderRecentReads() {
  const container = document.getElementById("recent-reads-list");
  const dateFilter = document.getElementById("filter-date").value;
  const typeFilter = document.getElementById("filter-type").value;
  const quadFilter = document.getElementById("filter-quad").value;

  // Get all quads with their latest read
  let quadsWithLatestRead = quads
    .map((quad) => {
      if (quad.reads.length === 0) return null;

      const latestRead = quad.reads[0]; // reads are already sorted newest first
      return {
        quadId: quad.id,
        quadName: quad.name,
        latestReadType: latestRead.type,
        latestReadDate: latestRead.date,
      };
    })
    .filter((q) => q !== null); // Remove quads with no reads

  // Apply filters
  if (dateFilter) {
    const filterDate = new Date(dateFilter).toDateString();
    quadsWithLatestRead = quadsWithLatestRead.filter(
      (quad) => new Date(quad.latestReadDate).toDateString() === filterDate
    );
  }

  if (typeFilter !== "all") {
    quadsWithLatestRead = quadsWithLatestRead.filter(
      (quad) => quad.latestReadType === typeFilter
    );
  }

  if (quadFilter) {
    quadsWithLatestRead = quadsWithLatestRead.filter(
      (quad) =>
        quad.quadId.toString().includes(quadFilter) ||
        quad.quadName.toLowerCase().includes(quadFilter.toLowerCase())
    );
  }

  // Sort by latest read date (newest first)
  quadsWithLatestRead.sort(
    (a, b) => new Date(b.latestReadDate) - new Date(a.latestReadDate)
  );

  // Take only the latest 24 unique quads
  const recentQuads = quadsWithLatestRead.slice(0, 24);

  // Render
  if (recentQuads.length === 0) {
    container.innerHTML = `<div class="empty-state" style="display: block;">
      <div class="empty-state-icon">📚</div>
      <h3>لا توجد تلاوات</h3>
      <p>ابدأ بإضافة أول تلاوة باستخدام النموذج أعلاه!</p>
    </div>`;
    return;
  }

  container.innerHTML = recentQuads
    .map(
      (quad) => `
        <div class="read-item ${
          quad.latestReadType
        }" onclick="showQuadHistory(${quad.quadId})">
            <div class="quad-name">${
              quad.quadName || `الربع ${quad.quadId}`
            }</div>
            <div>
                <span class="read-type">${
                  quad.latestReadType === "book" ? "قراءة" : "تسميع"
                }</span>
                <span class="quad-number">الربع رقم: ${quad.quadId}</span>
            </div>
            <div class="read-date">${formatDate(quad.latestReadDate)}</div>
        </div>
    `
    )
    .join("");
}

// Render quads grid ordered by latest read date
function renderQuadsGrid() {
  const container = document.getElementById("quads-grid");

  // Get all quads with their latest read date
  const quadsWithDates = quads.map((quad) => {
    const latestRead = quad.reads.length > 0 ? quad.reads[0].date : null;
    return {
      ...quad,
      latestRead,
    };
  });

  // Sort by latest read date (newest first, then by quad ID)
  quadsWithDates.sort((a, b) => {
    if (!a.latestRead && !b.latestRead) {
      return a.id - b.id;
    }
    if (!a.latestRead) return 1;
    if (!b.latestRead) return -1;
    return new Date(b.latestRead) - new Date(a.latestRead);
  });

  // Render as grid
  container.innerHTML = quadsWithDates
    .map((quad) => {
      const latestReadDate = quad.latestRead
        ? formatDateShort(quad.latestRead)
        : "لا يوجد تلاوة";

      // Count book and heart reads
      const bookCount = quad.reads.filter((r) => r.type === "book").length;
      const heartCount = quad.reads.filter((r) => r.type === "heart").length;

      return `
            <button class="quad-button ${
              quad.reads.length > 0 ? "has-reads" : ""
            }" 
                    onclick="showQuadDetail(${quad.id})">
                <span class="quad-number">الربع ${quad.id}</span>
                ${
                  quad.name
                    ? `<span class="quad-name-display">${quad.name}</span>`
                    : ""
                }
                <span class="read-counts">
                    <span class="count-book">${bookCount} - قراءة</span>
                    <span class="count-heart">${heartCount} - تسميع</span>
                </span>
                <span class="last-read-date">${latestReadDate}</span>
            </button>
        `;
    })
    .join("");
}

// Format date for grid display
function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Show quad detail view
function showQuadDetail(quadId) {
  currentQuadId = quadId;

  // Switch to detail view
  document.getElementById("history").classList.remove("active");
  document.getElementById("quad-detail").classList.add("active");

  // Render quad history
  renderQuadHistory();
}

// Show quad history screen (for backward compatibility with recent reads)
function showQuadHistory(quadId) {
  currentQuadId = quadId;

  // Switch to history tab first
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));

  document.querySelector('.tab[data-tab="history"]').classList.add("active");
  renderQuadsGrid();

  // Then show detail view
  showQuadDetail(quadId);
}

// Render quad history
function renderQuadHistory() {
  const quad = quads[currentQuadId - 1];
  const container = document.getElementById("quad-reads-list");

  // Update title
  document.getElementById(
    "detail-quad-title"
  ).textContent = `سجل تلاوة الربع ${currentQuadId}${
    quad.name ? ` - ${quad.name}` : ""
  }`;

  // Hide edit form if visible
  hideEditNameForm();

  // Render reads
  if (quad.reads.length === 0) {
    container.innerHTML = "<p>لا توجد تلاوات مسجلة لهذا الربع بعد</p>";
    return;
  }

  container.innerHTML = quad.reads
    .map(
      (read) => `
        <div class="read-item ${read.type}">
            <div>
                <span class="read-type">${
                  read.type === "book" ? "قراءة" : "تسميع"
                }</span>
            </div>
            <div class="read-date">${formatDate(read.date)}</div>
        </div>
    `
    )
    .join("");
}

// Show edit name form
function showEditNameForm() {
  const quad = quads[currentQuadId - 1];
  document.getElementById("new-quad-name").value = quad.name;
  document.getElementById("edit-name-form").style.display = "block";
}

// Hide edit name form
function hideEditNameForm() {
  document.getElementById("edit-name-form").style.display = "none";
}

// Save quad name
function saveQuadName() {
  const newName = document.getElementById("new-quad-name").value.trim();
  quads[currentQuadId - 1].name = newName;
  saveData();
  hideEditNameForm();
  renderQuadHistory();
  renderRecentReads(); // In case we need to update the name in recent reads

  // Update quads grid if it exists
  const historyTab = document.getElementById("history");
  if (historyTab) {
    renderQuadsGrid();
  }
}

// Render statistics
function renderStatistics() {
  const container = document.getElementById("stats-content");

  // Calculate statistics
  let totalReads = 0;
  let bookReads = 0;
  let heartReads = 0;
  let readQuads = 0;
  let namedQuads = 0;
  let totalDays = new Set();
  const readsByDate = {};

  quads.forEach((quad) => {
    if (quad.reads.length > 0) {
      readQuads++;
    }
    if (quad.name) {
      namedQuads++;
    }
    quad.reads.forEach((read) => {
      totalReads++;
      if (read.type === "book") bookReads++;
      if (read.type === "heart") heartReads++;

      const date = new Date(read.date).toDateString();
      totalDays.add(date);

      // Count readings per date for heat map
      if (!readsByDate[date]) {
        readsByDate[date] = 0;
      }
      readsByDate[date]++;
    });
  });

  const completionPercentage = ((readQuads / totalQuads) * 100).toFixed(1);

  // Generate heat map for last 365 days
  const heatMapData = generateHeatMap(readsByDate);

  container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);">
                <div style="font-size: 36px; font-weight: 700; margin-bottom: 8px;">${totalReads}</div>
                <div style="opacity: 0.9;">إجمالي التلاوات</div>
            </div>
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);">
                <div style="font-size: 36px; font-weight: 700; margin-bottom: 8px;">${bookReads}</div>
                <div style="opacity: 0.9;">قراءة</div>
            </div>
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);">
                <div style="font-size: 36px; font-weight: 700; margin-bottom: 8px;">${heartReads}</div>
                <div style="opacity: 0.9;">تسميع</div>
            </div>
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);">
                <div style="font-size: 36px; font-weight: 700; margin-bottom: 8px;">${readQuads}</div>
                <div style="opacity: 0.9;">من ${totalQuads} ربع</div>
            </div>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 20px;">
            <h3 style="margin-bottom: 16px; color: var(--dark-color);">نسبة الإتمام</h3>
            <div style="background: white; height: 24px; border-radius: 12px; overflow: hidden; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${completionPercentage}%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">${completionPercentage}%</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${namedQuads}</div>
                <div style="color: #64748b;">أرباع مسماة</div>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${
                  totalDays.size
                }</div>
                <div style="color: #64748b;">أيام النشاط</div>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${
                  totalReads > 0 ? (totalReads / totalDays.size).toFixed(1) : 0
                }</div>
                <div style="color: #64748b;">متوسط التلاوات/اليوم</div>
            </div>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin-top: 20px;">
            <h3 style="margin-bottom: 16px; color: var(--dark-color); display: flex; justify-content: space-between; align-items: center;">
                <span>خريطة النشاط</span>
                <span style="font-size: 0.85rem; color: #64748b; font-weight: normal;">آخر 365 يوم</span>
            </h3>
            <div id="heatmap-container" style="overflow-x: auto; padding: 10px 0;">
                ${heatMapData.html}
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 12px; color: #64748b; font-size: 0.85rem;">
                <span>أقل</span>
                <div style="display: flex; gap: 3px;">
                    <div style="width: 10px; height: 10px; background: #e5e7eb; border-radius: 2px;"></div>
                    <div style="width: 10px; height: 10px; background: #dbeafe; border-radius: 2px;"></div>
                    <div style="width: 10px; height: 10px; background: #93c5fd; border-radius: 2px;"></div>
                    <div style="width: 10px; height: 10px; background: #3b82f6; border-radius: 2px;"></div>
                    <div style="width: 10px; height: 10px; background: #1e40af; border-radius: 2px;"></div>
                </div>
                <span>أكثر</span>
            </div>
        </div>
    `;

  // Add tooltips to heat map
  setTimeout(() => {
    const heatMapDays = document.querySelectorAll(".heatmap-day");
    heatMapDays.forEach((day) => {
      day.addEventListener("mouseenter", function (e) {
        const count = Number.parseInt(e.target.dataset.count, 10);
        const date = e.target.dataset.date;
        if (count > 0) {
          const tooltip = document.createElement("div");
          tooltip.textContent = `${count} تلاوة في ${date}`;
          tooltip.style.cssText =
            "position: absolute; background: #1e293b; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; z-index: 1000; pointer-events: none; white-space: nowrap;";
          tooltip.style.top = `${e.target.offsetTop - 35}px`;
          tooltip.style.right = `${
            e.target.offsetLeft + e.target.offsetWidth / 2
          }px`;
          tooltip.style.transform = "translateX(50%)";
          e.target.appendChild(tooltip);
          e.target.dataset.tooltip = tooltip;
        }
      });
      day.addEventListener("mouseleave", function (e) {
        const tooltip = e.target.dataset.tooltip;
        if (tooltip) {
          document.querySelector(tooltip)?.remove();
        }
      });
    });
  }, 0);
}

// Generate heat map data for last 365 days
function generateHeatMap(readsByDate) {
  const now = new Date();
  const html = [];

  // Create grid: 52 weeks × 7 days
  const weeks = 53;

  for (let week = 0; week < weeks; week++) {
    html.push('<div style="display: flex; gap: 3px; margin-bottom: 3px;">');
    for (let day = 0; day < 7; day++) {
      const dateIndex = week * 7 + day;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - (365 - dateIndex));

      const dateString = targetDate.toDateString();
      const count = readsByDate[dateString] || 0;

      // Determine color based on count
      let color = "#e5e7eb"; // no activity
      if (count > 0) {
        if (count === 1) color = "#dbeafe";
        else if (count === 2) color = "#93c5fd";
        else if (count >= 3 && count <= 5) color = "#3b82f6";
        else color = "#1e40af";
      }

      html.push(
        `<div class="heatmap-day" data-count="${count}" data-date="${formatDateShort(
          dateString
        )}" style="width: 11px; height: 11px; background: ${color}; border-radius: 2px; cursor: pointer; transition: all 0.2s; position: relative;" title="${
          count > 0 ? count + " تلاوة" : "لا يوجد نشاط"
        }"></div>`
      );
    }
    html.push("</div>");
  }

  return {
    html: html.join(""),
  };
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Welcome Modal Functions
let currentSlide = 0;
const totalSlides = 4;

function showWelcomeModal() {
  const modal = document.getElementById("welcome-modal");
  if (modal) {
    modal.classList.add("active");
  }
}

function hideWelcomeModal() {
  const modal = document.getElementById("welcome-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    // Hide current slide
    document
      .querySelector(`.tutorial-slide[data-slide="${currentSlide}"]`)
      .classList.remove("active");
    document.querySelectorAll(".dot")[currentSlide].classList.remove("active");

    currentSlide++;

    // Show next slide
    document
      .querySelector(`.tutorial-slide[data-slide="${currentSlide}"]`)
      .classList.add("active");
    document.querySelectorAll(".dot")[currentSlide].classList.add("active");

    // Update button visibility
    if (currentSlide === totalSlides - 1) {
      document.getElementById("next-slide").style.display = "none";
      document.getElementById("skip-tutorial").style.display = "none";
      document.getElementById("finish-tutorial").style.display = "inline-block";
    }

    if (currentSlide > 0) {
      document.getElementById("prev-slide").style.display = "inline-block";
    }
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    // Hide current slide
    document
      .querySelector(`.tutorial-slide[data-slide="${currentSlide}"]`)
      .classList.remove("active");
    document.querySelectorAll(".dot")[currentSlide].classList.remove("active");

    currentSlide--;

    // Show previous slide
    document
      .querySelector(`.tutorial-slide[data-slide="${currentSlide}"]`)
      .classList.add("active");
    document.querySelectorAll(".dot")[currentSlide].classList.add("active");

    // Update button visibility
    if (currentSlide === 0) {
      document.getElementById("prev-slide").style.display = "none";
    }

    if (currentSlide < totalSlides - 1) {
      document.getElementById("next-slide").style.display = "inline-block";
      document.getElementById("skip-tutorial").style.display = "inline-block";
      document.getElementById("finish-tutorial").style.display = "none";
    }
  }
}

function skipTutorial() {
  localStorage.setItem("tutorialCompleted", "true");
  hideWelcomeModal();
}

function finishTutorial() {
  localStorage.setItem("tutorialCompleted", "true");
  hideWelcomeModal();
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
