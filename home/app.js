
/* =========================================
   DETwal — XAUUSD Trading Dashboard
   app.js | Frontend prototype
========================================= */

"use strict";

// -----------------------------------------
// 1. DOM HELPERS
// -----------------------------------------

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

function getElement(...ids) {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) return element;
  }
  return null;
}

function showToast(message, type = "success") {
  let toast = getElement("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "status");
  toast.hidden = false;

  // Automatically hide the message after a short delay.
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}

// -----------------------------------------
// 2. DEMO LOGIN
// -----------------------------------------

const loginView = getElement("loginView");
const appView = getElement("appView");
const loginForm = getElement("loginForm");
const loginError = getElement("loginError");

function showDashboard() {
  if (loginView) loginView.classList.add("hidden");
  if (appView) appView.classList.remove("hidden");
}

function showLogin() {
  if (appView) appView.classList.add("hidden");
  if (loginView) loginView.classList.remove("hidden");
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = $(
      'input[type="email"], input[name="email"]',
      loginForm
    );

    const passwordInput = $(
      'input[type="password"], input[name="password"]',
      loginForm
    );

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      if (loginError) {
        loginError.textContent = "Enter your email and password.";
        loginError.classList.remove("hidden");
      }
      return;
    }

    /*
      DEMO ONLY:
      This accepts any non-empty email and password.
      It is NOT real authentication.
      Do not use this method to protect admin controls.
    */

    if (loginError) {
      loginError.textContent = "";
      loginError.classList.add("hidden");
    }

    showDashboard();
    showToast("Demo dashboard opened.");
  });
}

// -----------------------------------------
// 3. NAVIGATION
// -----------------------------------------

function activateSection(target) {
  if (!target) return;

  const sections = $$(
    "[data-section], .page-section, section[id]"
  );

  const targetId = target.startsWith("#")
    ? target.slice(1)
    : target;

  let foundSection = false;

  sections.forEach((section) => {
    const isTarget = section.id === targetId ||
      section.dataset.section === targetId;

    if (isTarget) foundSection = true;

    section.classList.toggle("hidden", !isTarget);
  });

  $$(
    ".sidebar-nav a, .nav-link, [data-target]"
  ).forEach((link) => {
    const href = link.getAttribute("href");
    const linkTarget =
      link.dataset.target ||
      (href && href.startsWith("#") ? href.slice(1) : "");

    link.classList.toggle("active", linkTarget === targetId);
  });

  if (foundSection) {
    const section = document.getElementById(targetId);
    section?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

$$(".sidebar-nav a, .nav-link, [data-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    const target =
      link.dataset.target ||
      (href && href.startsWith("#") ? href.slice(1) : "");

    if (!target) return;

    const targetElement = document.getElementById(target);

    if (targetElement) {
      event.preventDefault();
      activateSection(target);
    }
  });
});

// -----------------------------------------
// 4. TRADING ZONE STORAGE
// -----------------------------------------

const STORAGE_KEY = "detwal_demo_zones_v1";

function loadZones() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const zones = saved ? JSON.parse(saved) : [];

    return Array.isArray(zones) ? zones : [];
  } catch (error) {
    console.warn("Could not load demo zones:", error);
    return [];
  }
}

let zones = loadZones();

function saveZones() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  } catch (error) {
    console.warn("Could not save demo zones:", error);
    showToast("Unable to save zones in this browser.", "error");
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function formatPrice(value) {
  return Number(value).toFixed(2);
}

// -----------------------------------------
// 5. RENDER TRADING ZONES
// -----------------------------------------

function renderZones() {
  const zoneContainer = getElement(
    "zonesList",
    "zoneList",
    "tradingZones",
    "zonesContainer"
  );

  if (!zoneContainer) return;

  if (zones.length === 0) {
    zoneContainer.innerHTML = `
      <div class="empty-state">
        No trading zones added yet.
        Create a zone to see it here.
      </div>
    `;
    updateZoneCount();
    return;
  }

  zoneContainer.innerHTML = zones.map((zone) => {
    const directionClass =
      zone.direction === "Buy" ? "zone-buy" : "zone-sell";

    const statusClass =
      zone.enabled ? "badge-green" : "badge-red";

    const statusText =
      zone.enabled ? "Enabled" : "Disabled";

    return `
      <article class="zone-card" data-zone-id="${escapeHTML(zone.id)}">
        <div class="zone-header">
          <div>
            <div class="zone-title">
              XAUUSD · ${escapeHTML(zone.direction)} zone
            </div>
            <div class="zone-prices">
              ${formatPrice(zone.start)} – ${formatPrice(zone.end)}
            </div>
          </div>

          <span class="badge ${directionClass}">
            ${escapeHTML(zone.direction)}
          </span>
        </div>

        <div class="zone-meta">
          <span class="badge ${statusClass}">
            ${statusText}
          </span>
          <span class="badge">
            ${escapeHTML(zone.timeframe || "M15")}
          </span>
        </div>

        ${
          zone.note
            ? `<p class="zone-prices">${escapeHTML(zone.note)}</p>`
            : ""
        }

        <div class="zone-actions">
          <button
            type="button"
            class="btn btn-secondary"
            data-action="toggle"
            data-id="${escapeHTML(zone.id)}"
          >
            ${zone.enabled ? "Disable zone" : "Enable zone"}
          </button>

          <button
            type="button"
            class="btn btn-danger"
            data-action="delete"
            data-id="${escapeHTML(zone.id)}"
          >
            Delete
          </button>
        </div>
      </article>
    `;
  }).join("");

  updateZoneCount();
}

function updateZoneCount() {
  const count = zones.length;

  const countElement = getElement(
    "zoneCount",
    "totalZones",
    "zonesCount"
  );

  if (countElement) {
    countElement.textContent = String(count);
  }

  const enabledElement = getElement(
    "enabledZoneCount",
    "activeZones"
  );

  if (enabledElement) {
    enabledElement.textContent = String(
      zones.filter((zone) => zone.enabled).length
    );
  }
}

// -----------------------------------------
// 6. ADD A TRADING ZONE
// -----------------------------------------

const zoneForm = getElement("addZoneForm", "zoneForm");
const zoneModal = getElement("addZoneModal", "zoneModal");

function openZoneModal() {
  if (zoneModal) {
    zoneModal.classList.remove("hidden");
  } else {
    showToast("Add-zone modal not found in index.html.", "error");
  }
}

function closeZoneModal() {
  if (zoneModal) zoneModal.classList.add("hidden");
}

$$(
  "#addZoneBtn, #openAddZone, [data-open-zone-modal]"
).forEach((button) => {
  button.addEventListener("click", openZoneModal);
});

$$(
  "#closeZoneModal, #cancelAddZone, [data-close-zone-modal]"
).forEach((button) => {
  button.addEventListener("click", closeZoneModal);
});

if (zoneModal) {
  zoneModal.addEventListener("click", (event) => {
    if (event.target === zoneModal) {
      closeZoneModal();
    }
  });
}

if (zoneForm) {
  zoneForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const directionInput = getElement(
      "zoneDirection",
      "direction"
    );

    const startInput = getElement(
      "zoneStart",
      "zoneStartPrice"
    );

    const endInput = getElement(
      "zoneEnd",
      "zoneEndPrice"
    );

    const noteInput = getElement(
      "zoneNote",
      "zoneDescription"
    );

    const timeframeInput = getElement(
      "zoneTimeframe",
      "timeframe"
    );

    const direction = directionInput?.value || "Buy";
    const start = Number(startInput?.value);
    const end = Number(endInput?.value);

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start <= 0 ||
      end <= 0
    ) {
      showToast("Enter valid positive zone prices.", "error");
      return;
    }

    if (start === end) {
      showToast("Zone prices cannot be identical.", "error");
      return;
    }

    if (!["Buy", "Sell"].includes(direction)) {
      showToast("Choose Buy or Sell.", "error");
      return;
    }

    const zone = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: "XAUUSD",
      direction,
      start: Math.min(start, end),
      end: Math.max(start, end),
      timeframe: timeframeInput?.value || "M15",
      note: noteInput?.value.trim() || "",
      enabled: true,
      createdAt: new Date().toISOString()
    };

    zones.unshift(zone);
    saveZones();
    renderZones();

    zoneForm.reset();
    closeZoneModal();

    showToast("Demo trading zone added.");
  });
}

// -----------------------------------------
// 7. ENABLE, DISABLE, OR DELETE ZONES
// -----------------------------------------

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action][data-id]");
  if (!button) return;

  const { action, id } = button.dataset;
  const zone = zones.find((item) => item.id === id);

  if (!zone) return;

  if (action === "toggle") {
    zone.enabled = !zone.enabled;
    saveZones();
    renderZones();

    showToast(
      zone.enabled ? "Zone enabled." : "Zone disabled."
    );
  }

  if (action === "delete") {
    const confirmed = window.confirm(
      "Delete this demo trading zone?"
    );

    if (!confirmed) return;

    zones = zones.filter((item) => item.id !== id);
    saveZones();
    renderZones();
    showToast("Zone deleted.");
  }
});

// -----------------------------------------
// 8. DEMO BOT STATUS
// -----------------------------------------

function setDemoBotStatus(isOnline) {
  const statusElement = getElement(
    "botStatus",
    "connectionStatus"
  );

  if (!statusElement) return;

  statusElement.textContent = isOnline
    ? "Dashboard online · Demo only"
    : "Dashboard offline";

  statusElement.classList.toggle("status-online", isOnline);
  statusElement.classList.toggle("status-offline", !isOnline);
}

setDemoBotStatus(true);

// -----------------------------------------
// 9. INITIALIZE DASHBOARD
// -----------------------------------------

function initializeDashboard() {
  renderZones();

  // A GitHub Pages frontend cannot connect to MT5 by itself.
  // This status means only that the interface has loaded.
  console.info(
    "DETwal dashboard loaded. Demo mode: no MT5 connection."
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
  );
} else {
  initializeDashboard();
}
