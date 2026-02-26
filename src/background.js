// src/background.js
console.log("background.js chargé !");

import { Tracker } from "./tracker.js";

/* Utilitaires device info */
function getDeviceInfo() {
  return {
    user_agent: navigator.userAgent,
    browser: "Chrome",
    platform: navigator.platform,
    language: navigator.language
  };
}

/* 1) Ouvrir consent.html uniquement à l'installation */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "src/consent/consent.html" });
  }
});

/* 2) Initialisation du tracker à chaque réveil du service worker */
function initializeTracker() {
  chrome.storage.local.get(["consent", "preferences", "setup"], (res) => {
    console.log("INIT CHECK:", res);

    if (!res.setup) {
      const setup = {
        visitor_id: crypto.randomUUID(),
        session_id: Date.now(),
        timestamp: new Date().toISOString()
      };
      chrome.storage.local.set({ setup });
    }

    if (res.consent === "accepted") {
      Tracker.init(res.consent, res.preferences || {});
      initActivityModule();
    } else {
      Tracker.updateConsent(res.consent || "refused", res.preferences || {});
    }
  });
}
initializeTracker();

/* 3) Messages : consent / preferences / autres */
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg?.type) return;

  if (msg.type === "CONSENT_UPDATE") {
    Tracker.updateConsent(msg.value, msg.preferences);
    chrome.tabs.query({ url: chrome.runtime.getURL("src/consent/consent.html") }, (tabs) => {
      tabs.forEach(t => chrome.tabs.remove(t.id));
    });
    initializeTracker();
  }

  if (msg.type === "PREFERENCES_UPDATE") {
    Tracker.updatePreferences(msg.preferences || {});
    initializeTracker();
  }
});

/* 4) Module ajout_supp notes */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "NOTE_ADD") {
    Tracker.track("ajout_supp", "NOTE_ADD", {
      note_id: msg.note_id,
      length: msg.length,
      from: msg.from || "popup",
      human_readable: "Ajout ou modification d’une note.",
      device_info: getDeviceInfo()
    });
  }

  if (msg.type === "NOTE_DELETE") {
    Tracker.track("ajout_supp", "NOTE_DELETE", {
      note_id: msg.note_id,
      from: msg.from || "popup",
      human_readable: "Suppression d’une note.",
      device_info: getDeviceInfo()
    });
  }
});

/* 5) Module periode ouverture/fermeture extension */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "EXTENSION_OPEN") {
    chrome.storage.local.set({ extension_open_at: Date.now() });

    Tracker.track("periode", "EXTENSION_OPEN", {
      from: msg.from || "unknown",
      human_readable: "Ouverture de l’extension TrackAware.",
      device_info: getDeviceInfo()
    });
  }

  if (msg.type === "EXTENSION_CLOSE") {
    chrome.storage.local.get(["extension_open_at"], (res) => {
      const openAt = res.extension_open_at;
      const duration = openAt ? Date.now() - openAt : null;

      Tracker.track("periode", "EXTENSION_CLOSE", {
        duration_ms: duration,
        duration_s: duration ? Math.round(duration / 1000) : null,
        from: msg.from || "unknown",
        human_readable: `Fermeture de l’extension après ${Math.round((duration || 0) / 1000)} secondes.`,
        device_info: getDeviceInfo()
      });

      chrome.storage.local.remove("extension_open_at");
    });
  }
});

/* 6) Module url domaine visité */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

  chrome.storage.local.get(["preferences"], (res) => {
    if (!res.preferences?.url) return;
    if (!tab?.url) return;

    let domain = null;
    try {
      domain = new URL(tab.url).hostname;
    } catch (_) {
      return;
    }

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;

    const urlObj = new URL(tab.url);

    Tracker.track("url", "DOMAIN_VISIT", {
      tab_id: tabId,
      window_id: tab.windowId,
      domain,
      protocol: urlObj.protocol.replace(":", ""),
      path: urlObj.pathname,
      is_secure: urlObj.protocol === "https:",
      human_readable: `Visite du domaine ${domain}.`,
      device_info: getDeviceInfo()
    });
  });
});

/* 7) Module temps + onglet (final) */
let activeTimer = {
  tabId: null,
  windowId: null,
  domain: null,
  startedAt: null
};

function getDomain(url) {
  try {
    if (!url) return null;
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) return null;
    return new URL(url).hostname;
  } catch (_) {
    return null;
  }
}

function startTimer(tabId, windowId, url) {
  const domain = getDomain(url);

  if (!domain) {
    activeTimer = { tabId, windowId, domain: null, startedAt: null };
    return;
  }

  activeTimer = {
    tabId,
    windowId,
    domain,
    startedAt: Date.now()
  };
}

function logTimeSpent(reason) {
  chrome.storage.local.get(["preferences"], (res) => {
    if (!res.preferences?.temps) return;
    if (!activeTimer.startedAt || !activeTimer.domain) return;

    const durationMs = Date.now() - activeTimer.startedAt;
    if (durationMs < 800) return;

    Tracker.track("temps", "TIME_SPENT", {
      tab_id: activeTimer.tabId,
      window_id: activeTimer.windowId,
      domain: activeTimer.domain,
      duration_ms: durationMs,
      duration_s: Math.round(durationMs / 1000),
      reason,
      human_readable: `Temps passé sur ${activeTimer.domain} : ${Math.round(durationMs / 1000)} secondes.`,
      device_info: getDeviceInfo()
    });

    activeTimer.startedAt = null;
  });
}

/* Démarrer le timer au réveil du SW sur l'onglet actif courant */
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs?.[0];
  if (tab?.url) startTimer(tab.id, tab.windowId, tab.url);
});

/* Listeners */
chrome.tabs.onActivated.addListener((activeInfo) => {
  logTimeSpent("tab_switch");

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    startTimer(activeInfo.tabId, activeInfo.windowId, tab?.url);

    chrome.storage.local.get(["preferences"], (res) => {
      const prefs = res.preferences || {};

      /* Module onglet */
      if (prefs.onglet) {
        const domain = getDomain(tab?.url);

        Tracker.track("onglet", "TAB_SWITCH", {
          tab_id: activeInfo.tabId,
          window_id: activeInfo.windowId,
          domain,
          human_readable: `Changement d’onglet vers ${domain || "un onglet interne"}.`,
          device_info: getDeviceInfo()
        });
      }

      /* 🔥 Nouveau module nbOnglet basé sur TAB_SWITCH */
      if (prefs.nbOnglet) {
        chrome.tabs.query({}, (tabs) => {
          Tracker.track("nb_onglet", "TAB_COUNT", {
            count: tabs.length,
            reason: "tab_switch",
            human_readable: `Nombre d’onglets ouverts : ${tabs.length}.`,
            device_info: getDeviceInfo()
          });
        });
      }
    });
  });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    logTimeSpent("window_blur");
    activeTimer.startedAt = null;
    return;
  }

  logTimeSpent("window_focus_change");

  chrome.tabs.query({ active: true, windowId }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab) return;
    startTimer(tab.id, windowId, tab.url);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTimer.tabId === tabId) {
    logTimeSpent("tab_closed");
    activeTimer.startedAt = null;
  }
});

/* 9) Module activite */
let activityAttached = false;
let lastActivityState = "active";
let lastActivityTimestamp = Date.now();

function initActivityModule() {
  if (activityAttached) return;

  chrome.storage.local.get(["preferences"], (res) => {
    if (!res.preferences?.activite) return;

    activityAttached = true;

    const idleThresholdMs = 60000;
    chrome.idle.setDetectionInterval(idleThresholdMs / 1000);

    chrome.idle.onStateChanged.addListener(async (state) => {
      const now = Date.now();

      const durationIdleMs = state === "active"
        ? now - lastActivityTimestamp
        : 0;

      const durationIdleS = Math.round(durationIdleMs / 1000);

      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const windowFocused = Boolean(tab);
      const tabId = tab?.id || null;

      let eventName = "";
      let human = "";

      if (state === "idle") {
        eventName = "USER_BECAME_IDLE";
        human = "L’utilisateur est devenu inactif.";
      }
      if (state === "active") {
        eventName = "USER_RETURNED_ACTIVE";
        human = `L’utilisateur est redevenu actif après ${durationIdleS} secondes d’inactivité.`;
      }
      if (state === "locked") {
        eventName = "USER_SCREEN_LOCKED";
        human = "L’écran de l’utilisateur a été verrouillé.";
      }

      Tracker.track("activite", eventName, {
        previous_state: lastActivityState,
        new_state: state,
        idle_threshold_s: idleThresholdMs / 1000,
        duration_idle_s: durationIdleS,
        window_focused: windowFocused,
        tab_id: tabId,
        activity_source: "chrome.idle",
        human_readable: human,
        device_info: getDeviceInfo()
      });

      lastActivityState = state;
      lastActivityTimestamp = now;
    });
  });
}
