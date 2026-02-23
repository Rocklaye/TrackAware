console.log("background.js chargé");

import { Tracker } from "./tracker.js";

/* ---------------------------------------------------------
   1) Ouvrir consent.html uniquement à l'installation
--------------------------------------------------------- */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "consent.html" });
  }
});

/* ---------------------------------------------------------
   2) Initialisation du tracker à CHAQUE réveil du SW
--------------------------------------------------------- */
function initializeTracker() {
  chrome.storage.local.get(["consent", "preferences", "setup"], (res) => {
    console.log("INIT CHECK:", res);

    // Toujours créer visitor_id + session_id si absents
    if (!res.setup) {
      const setup = {
        visitor_id: crypto.randomUUID(),
        session_id: Date.now(),
        timestamp: new Date().toISOString()
      };
      chrome.storage.local.set({ setup });
    }

    // Si consentement accepté → activer le tracking
    if (res.consent === "accepted") {
      Tracker.init(res.consent, res.preferences || {});
      initActivityModule();
    }
  });
}

initializeTracker();

/* ---------------------------------------------------------
   3) Mise à jour du consentement / préférences
--------------------------------------------------------- */
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg?.type) return;

  if (msg.type === "CONSENT_UPDATE") {
    Tracker.updateConsent(msg.value, msg.preferences);

    chrome.tabs.query({ url: chrome.runtime.getURL("consent.html") }, (tabs) => {
      tabs.forEach(t => chrome.tabs.remove(t.id));
    });

    initializeTracker();
  }

  if (msg.type === "PREFERENCES_UPDATE") {
    Tracker.updatePreferences(msg.preferences);
    initActivityModule();
  }
});

/* ---------------------------------------------------------
   4) Module : ajout_supp (notes)
--------------------------------------------------------- */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "NOTE_ADD") {
    Tracker.track("ajout_supp", "NOTE_ADD", {
      note_id: msg.note_id,
      length: msg.length,
      from: msg.from || "popup"
    });
  }

  if (msg.type === "NOTE_DELETE") {
    Tracker.track("ajout_supp", "NOTE_DELETE", {
      note_id: msg.note_id,
      from: msg.from || "popup"
    });
  }
});

/* ---------------------------------------------------------
   5) Module : periode (ouverture/fermeture extension)
--------------------------------------------------------- */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "EXTENSION_OPEN") {
    chrome.storage.local.set({ extension_open_at: Date.now() });

    Tracker.track("periode", "EXTENSION_OPEN", {
      from: msg.from || "unknown"
    });
  }

  if (msg.type === "EXTENSION_CLOSE") {
    chrome.storage.local.get(["extension_open_at"], (res) => {
      const openAt = res.extension_open_at;
      const duration = openAt ? Date.now() - openAt : null;

      Tracker.track("periode", "EXTENSION_CLOSE", {
        duration_ms: duration,
        from: msg.from || "unknown"
      });

      chrome.storage.local.remove("extension_open_at");
    });
  }
});

/* ---------------------------------------------------------
   6) Module : url (domaine visité)
--------------------------------------------------------- */
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

    Tracker.track("url", "DOMAIN_VISIT", {
      tab_id: tabId,
      window_id: tab.windowId,
      domain
    });
  });
});

/* ---------------------------------------------------------
   7) Module : temps + onglet
--------------------------------------------------------- */
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

function logTimeSpent(reason) {
  chrome.storage.local.get(["preferences"], (res) => {
    if (!res.preferences?.temps) return;

    if (!activeTimer.startedAt || !activeTimer.domain) return;

    const duration = Date.now() - activeTimer.startedAt;
    if (duration < 800) return;

    Tracker.track("temps", "TIME_SPENT", {
      tab_id: activeTimer.tabId,
      window_id: activeTimer.windowId,
      domain: activeTimer.domain,
      duration_ms: duration,
      reason
    });
  });
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

chrome.tabs.onActivated.addListener((activeInfo) => {
  logTimeSpent("tab_switch");

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    startTimer(activeInfo.tabId, activeInfo.windowId, tab?.url);

    chrome.storage.local.get(["preferences"], (res) => {
      if (!res.preferences?.onglet) return;

      const domain = getDomain(tab?.url);

      Tracker.track("onglet", "TAB_SWITCH", {
        tab_id: activeInfo.tabId,
        window_id: activeInfo.windowId,
        domain
      });
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

/* ---------------------------------------------------------
   8) Module : activite
--------------------------------------------------------- */
let activityAttached = false;

function initActivityModule() {
  if (activityAttached) return;

  chrome.storage.local.get(["preferences"], (res) => {
    if (!res.preferences?.activite) return;

    activityAttached = true;

    chrome.idle.setDetectionInterval(60);

    let lastState = null;

    chrome.idle.onStateChanged.addListener((state) => {
      if (state === lastState) return;
      lastState = state;

      Tracker.track("activite", `USER_${state.toUpperCase()}`, { state });
    });
  });
}
