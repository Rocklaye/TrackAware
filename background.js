console.log("✅ background.js chargé");

importScripts("tracker.js");

let activityListenerAttached = false;

//  Gestion du consentement au démarrage 
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "consent.html" });
    }
});

// Initialisation du tracker avec vérification du consentement 
chrome.storage.local.get(["consent"], res => {
    if (!res.consent) {
        // L'utilisateur n'a pas encore choisi, on force la page de consentement
        chrome.tabs.create({ url: "consent.html" });
    } else {
        // Le consentement existe, on initialise le tracker normalement
        Tracker.init(res.consent);
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "PING_TEST") {
        console.log("✅ PING reçu");
        sendResponse({ ok: true });
    }
});

let start = Date.now();

// --- Module: periode (ouverture/fermeture extension) ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === "EXTENSION_OPEN") {
    const openAt = Date.now();

    chrome.storage.local.set({ extension_open_at: openAt });

    Tracker.track("periode", "extension_open", {
      from: msg.from || "unknown"
    });

    sendResponse({ ok: true });
    return;
  }

  if (msg.type === "EXTENSION_CLOSE") {
    chrome.storage.local.get(["extension_open_at"], (res) => {
      const openAt = res.extension_open_at;
      const durationMs = openAt ? (Date.now() - openAt) : null;

      Tracker.track("periode", "extension_close", {
        from: msg.from || "unknown",
        duration_ms: durationMs
      });

      chrome.storage.local.remove(["extension_open_at"]);
      sendResponse({ ok: true });
    });

    return true;
  }
});

// --- Module: ajout_supp (ajout/suppression de notes) ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg?.type) return;

  if (msg.type === "NOTE_ADD") {
    Tracker.track("ajout_supp", "note_add", {
      note_id: msg.note_id ?? null,
      length: typeof msg.length === "number" ? msg.length : null,
      from: msg.from || "popup"
    });
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === "NOTE_DELETE") {
    Tracker.track("ajout_supp", "note_delete", {
      note_id: msg.note_id ?? null,
      from: msg.from || "popup"
    });
    sendResponse({ ok: true });
    return;
  }
});

// --- Module: onglet (changement d’onglet actif) + temps ---
chrome.tabs.onActivated.addListener((activeInfo) => {
  // 1) fermer l'ancien timer
  logTimeSpent("tab_switch");

  // 2) récupérer le tab une seule fois
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (!tab) return;

    // 3) démarrer le nouveau timer
    startTimer(activeInfo.tabId, activeInfo.windowId, tab.url);

    // 4) TAB_SWITCH si consentement onglet
    chrome.storage.local.get(["consent"], (res) => {
      if (!res?.consent?.onglet) return;

      let domain = null;
      try { if (tab.url) domain = new URL(tab.url).hostname; } catch (_) {}

      Tracker.track("onglet", "TAB_SWITCH", {
        tab_id: activeInfo.tabId,
        window_id: activeInfo.windowId,
        title: tab.title || null,
        domain: domain,
        from: "tabs.onActivated"
      });
    });
  });
});

// --- Module: url (domaine visité) ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    // On log seulement quand la page a fini de charger
    if (changeInfo.status !== "complete") return;

    chrome.storage.local.get(["consent"], (res) => {
      if (!res?.consent?.url) return;
      if (!tab?.url) return;

      let domain = null;
      try {
        domain = new URL(tab.url).hostname;
      } catch (_) {
        return;
      }

      // Option: éviter de log les pages internes chrome://
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;

      Tracker.track("url", "DOMAIN_VISIT", {
        tab_id: tabId,
        window_id: tab.windowId,
        domain,
        from: "tabs.onUpdated"
      });
    });
  } catch (_) {}
});

// --- Module: temps (temps passé sur le domaine actif) ---
let activeTimer = {
  tabId: null,
  windowId: null,
  domain: null,
  startedAt: null
};

function getDomainFromUrl(url) {
  try {
    if (!url) return null;
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) return null;
    return new URL(url).hostname;
  } catch (_) {
    return null;
  }
}

function logTimeSpent(reason) {
  chrome.storage.local.get(["consent"], (res) => {
    if (!res?.consent?.temps) return;
    if (!activeTimer.startedAt) return;
    if (!activeTimer.domain) return; // ignore pages internes (chrome:// etc.)

    const durationMs = Date.now() - activeTimer.startedAt;

    // ignore les micro-switch
    if (durationMs < 800) return;

    console.log("[temps] close", { domain: activeTimer.domain, durationMs, reason });

    Tracker.track("temps", "TIME_SPENT", {
      tab_id: activeTimer.tabId,
      window_id: activeTimer.windowId,
      domain: activeTimer.domain,
      duration_ms: durationMs,
      reason
    });
  });
}

function startTimer(tabId, windowId, url) {
  console.log("[temps] start", tabId, windowId, url);

  const domain = getDomainFromUrl(url);

  // pages internes -> ne pas démarrer de timer
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

// Au changement d’onglet
chrome.tabs.onActivated.addListener((activeInfo) => {
  logTimeSpent("tab_switch");

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    startTimer(activeInfo.tabId, activeInfo.windowId, tab?.url);
  });
});

// Quand la fenêtre Chrome perd/gagne le focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Chrome n'est plus actif
    logTimeSpent("window_blur");
    activeTimer.startedAt = null;
    return;
  }

  // Nouvelle fenêtre active
  logTimeSpent("window_focus_change");

  chrome.tabs.query({ active: true, windowId }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) return;
    startTimer(tab.id, windowId, tab.url);
  });
});

// Si l’onglet actif est fermé
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTimer.tabId === tabId) {
    logTimeSpent("tab_closed");
    activeTimer.startedAt = null;
  }
});

// --- Module: activite (activité / inactivité utilisateur) ---
function initActivityModule() {
  chrome.storage.local.get(["consent"], (res) => {
    if (!res?.consent?.activite) return;

    // Seuil d'inactivité (en secondes)
    chrome.idle.setDetectionInterval(60);

    // État précédent
    let lastState = null;

    chrome.idle.onStateChanged.addListener((state) => {
      // state: "active" | "idle" | "locked"
      if (state === lastState) return;
      lastState = state;

      if (state === "idle") {
        Tracker.track("activite", "USER_IDLE", { state });
      } else if (state === "active") {
        Tracker.track("activite", "USER_ACTIVE", { state });
      } else if (state === "locked") {
        Tracker.track("activite", "USER_LOCKED", { state });
      }
    });
  });
}

// appeler une fois au démarrage
initActivityModule();
function initActivityModule() {
  if (activityListenerAttached) return;

  chrome.storage.local.get(["consent"], (res) => {
    if (!res?.consent?.activite) return;

    activityListenerAttached = true;

    chrome.idle.setDetectionInterval(60);

    let lastState = null;
    chrome.idle.onStateChanged.addListener((state) => {
      if (state === lastState) return;
      lastState = state;

      if (state === "idle") Tracker.track("activite", "USER_IDLE", { state });
      else if (state === "active") Tracker.track("activite", "USER_ACTIVE", { state });
      else if (state === "locked") Tracker.track("activite", "USER_LOCKED", { state });
    });
  });
}
