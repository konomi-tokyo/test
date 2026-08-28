const SECONDS_SAVED_PER_AD = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMPACT_THRESHOLD = 10000;
const FALLBACK_VERSION = "1.0.0";

function formatNumber(value) {
  return new Intl.NumberFormat(navigator.language).format(value);
}

function formatStatCount(value) {
  if (value <= COMPACT_THRESHOLD) return formatNumber(value);
  return new Intl.NumberFormat(navigator.language, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatUnit(value, unit, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(navigator.language, {
    style: "unit",
    unit,
    unitDisplay: "narrow",
    maximumFractionDigits,
  }).format(value);
}

function formatTimeSaved(seconds) {
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const years = days / 365;

  if (years >= 1) return formatUnit(years, "year", 1);
  if (days >= 1) return formatUnit(Math.floor(days), "day");
  if (hours >= 1) return formatUnit(hours, "hour", 1);
    return formatUnit(Math.max(1, Math.floor(minutes)), "minute");
}

function parseInstallDate(installDate) {
  if (typeof installDate === "number") return installDate;
  if (typeof installDate !== "string" || !installDate) return NaN;

  const parsed = Date.parse(installDate);
  return Number.isFinite(parsed) ? parsed : Number(installDate);
}

function setStat(name, value) {
  const element = document.querySelector(`[data-stat="${name}"]`);
  if (element) element.textContent = value;
}

function renderStats(info = {}) {
  const queryCount = parseInt(adblock.query.get("bc"), 10);
  const adsBlocked = Number.isFinite(queryCount) ? queryCount : (info.blockCount || 0);

  const installedAt = parseInstallDate(info.installDate);
  const daysProtected = Number.isFinite(installedAt)
    ? Math.max(1, Math.floor((Date.now() - installedAt) / MS_PER_DAY))
    : 1;

  setStat("ads-blocked", formatStatCount(adsBlocked));
  setStat("time-saved", formatTimeSaved(adsBlocked * SECONDS_SAVED_PER_AD));
  setStat("days-protected", formatNumber(daysProtected));

   const headlineCount = document.querySelector(".whats-new-status__headline-count");
  if (headlineCount) {
    headlineCount.textContent = "";
    if (adsBlocked > 0) {
      const template = adblock.strings["whats-new-status__headline-count"] || "";
      const [before = "", after = ""] = template.split("{count}");
      const count = document.createElement("span");
      count.className = "whats-new-status__count";
      count.textContent = formatNumber(adsBlocked);
      headlineCount.append(before, count, after);
    }
  }

   const extensionVersion = info.version || FALLBACK_VERSION;
   document.querySelectorAll(".whats-new-header__version-number, .whats-new-changelog__version")
    .forEach(element => { element.textContent = `v${extensionVersion}`; });
}

try {
  renderStats();
  adblock.afterAdblockPlusDetected(renderStats, true);
} catch (error) {
  adblock.logScriptError("whats-new.stats", error);
}

const CHECKOUT_GRACE_PERIOD = 8000;

setTimeout(() => {
  const stillDisabled = document.querySelector(".whats-new-checkout-button:disabled");
  if (!stillDisabled) return;

  document.documentElement.dataset.checkoutUnavailable = "1";
  adblock.logScriptError("whats-new.checkout-unavailable", new Error(
    `Prices did not resolve within ${CHECKOUT_GRACE_PERIOD}ms; paddleLoaded=${!!window.Paddle}`
  ));
}, CHECKOUT_GRACE_PERIOD);
