
// src/background.js

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

/* 1) Consentement */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "src/consent/consent.html"
    });
  }
});

/* 2) Initialisation */
function initializeTracker() {
  chrome.storage.local.get(
    ["consent", "preferences", "setup"],
    (res) => {
      if (!res.setup) {
        chrome.storage.local.set({
          setup: {
            visitor_id: crypto.randomUUID(),
            session_id: Date.now(),
            timestamp: new Date().toISOString()
          }
        });
      }

      if (res.consent === "accepted") {
        Tracker.init(res.consent, res.preferences || {});
        initActivityModule();
      } else {
        Tracker.updateConsent(
          res.consent || "refused",
          res.preferences || {}
        );
      }
    }
  );
}

initializeTracker();

/* 3) Messages */
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg?.type) return;

  if (msg.type === "CONSENT_UPDATE") {
    Tracker.updateConsent(
      msg.value,
      msg.preferences
    );

    chrome.tabs.query(
      {
        url: chrome.runtime.getURL(
          "src/consent/consent.html"
        )
      },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.remove(tab.id);
        });
      }
    );

    initializeTracker();
  }

  if (msg.type === "PREFERENCES_UPDATE") {
    Tracker.updatePreferences(
      msg.preferences || {}
    );
    initializeTracker();
  }
});

/* 4) Notes */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "NOTE_ADD") {
    Tracker.track("ajout_supp", "NOTE_ADD", {
      note_id: msg.note_id,
      length: msg.length,
      from: msg.from || "popup",
      human_readable:
        "Ajout ou modification d’une note.",
      device_info: getDeviceInfo()
    });
  }

  if (msg.type === "NOTE_DELETE") {
    Tracker.track("ajout_supp", "NOTE_DELETE", {
      note_id: msg.note_id,
      from: msg.from || "popup",
      human_readable:
        "Suppression d’une note.",
      device_info: getDeviceInfo()
    });
  }
});

/* 5) Période */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "EXTENSION_OPEN") {
    chrome.storage.local.set({
      extension_open_at: Date.now()
    });

    Tracker.track("periode", "EXTENSION_OPEN", {
      from: msg.from || "unknown",
      human_readable:
        "Ouverture de l’extension TrackAware.",
      device_info: getDeviceInfo()
    });
  }

  if (msg.type === "EXTENSION_CLOSE") {
    chrome.storage.local.get(
      ["extension_open_at"],
      (res) => {
        const openAt = res.extension_open_at;
        const duration = openAt
          ? Date.now() - openAt
          : null;

        Tracker.track(
          "periode",
          "EXTENSION_CLOSE",
          {
            duration_ms: duration,
            duration_s: duration !== null
              ? Math.round(duration / 1000)
              : null,
            from: msg.from || "unknown",
            human_readable:
              `Fermeture de l’extension après ${Math.round((duration || 0) / 1000)} secondes.`,
            device_info: getDeviceInfo()
          }
        );

        chrome.storage.local.remove(
          "extension_open_at"
        );
      }
    );
  }
});

/* 6) Utilitaires URL */
function getDomain(url) {
  try {
    if (!url) return null;

    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    return parsed.hostname;
  } catch (_) {
    return null;
  }
}

/* 7) Module Temps */

// Stockage persistant : le chronomètre n'est pas
// perdu si Chrome met le Service Worker en veille.
const TIMER_KEY = "trackaware_active_timer";

let timerQueue = Promise.resolve();

async function recordTimeSpent(
  timer,
  reason,
  endTime = Date.now()
) {
  if (!timer?.domain || !timer?.startedAt) {
    return;
  }

  const durationMs = endTime - timer.startedAt;

  if (durationMs < 800) return;

  const { preferences } =
    await chrome.storage.local.get("preferences");

  if (!preferences?.temps) return;

  Tracker.track("temps", "TIME_SPENT", {
    tab_id: timer.tabId,
    window_id: timer.windowId,
    domain: timer.domain,
    duration_ms: durationMs,
    duration_s: Math.round(durationMs / 1000),
    reason,
    human_readable:
      `Temps passé sur ${timer.domain} : ${Math.round(durationMs / 1000)} secondes.`,
    device_info: getDeviceInfo()
  });
}

function updateActiveTimer(
  tabId,
  windowId,
  url,
  reason
) {
  const newDomain = getDomain(url);
  const endTime = Date.now();

  timerQueue = timerQueue
    .then(async () => {
      const result =
        await chrome.storage.local.get(TIMER_KEY);

      const previousTimer = result[TIMER_KEY];

      // Même onglet et même domaine :
      // ne pas réinitialiser le chronomètre.
      if (
        previousTimer?.tabId === tabId &&
        previousTimer?.windowId === windowId &&
        previousTimer?.domain === newDomain
      ) {
        return;
      }

      // Enregistrer la période précédente.
      await recordTimeSpent(
        previousTimer,
        reason,
        endTime
      );

      if (!newDomain) {
        await chrome.storage.local.remove(
          TIMER_KEY
        );
        return;
      }

      // Démarrer le nouveau chronomètre.
      await chrome.storage.local.set({
        [TIMER_KEY]: {
          tabId,
          windowId,
          domain: newDomain,
          startedAt: endTime
        }
      });
    })
    .catch((error) => {
      console.error(
        "Erreur du chronomètre TrackAware :",
        error
      );
    });
}

/* Initialiser le chronomètre au démarrage */
chrome.tabs.query(
  {
    active: true,
    lastFocusedWindow: true
  },
  (tabs) => {
    const tab = tabs?.[0];

    if (tab?.url) {
      updateActiveTimer(
        tab.id,
        tab.windowId,
        tab.url,
        "worker_restart"
      );
    }
  }
);

/* 8) Module URL */
chrome.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") {
      return;
    }

    if (tab.active && tab.url) {
      updateActiveTimer(
        tabId,
        tab.windowId,
        tab.url,
        "page_navigation"
      );
    }

    chrome.storage.local.get(
      ["preferences"],
      (res) => {
        if (!res.preferences?.url) return;
        if (!tab?.url) return;

        const domain = getDomain(tab.url);
        if (!domain) return;

        const urlObj = new URL(tab.url);

        Tracker.track(
          "url",
          "DOMAIN_VISIT",
          {
            tab_id: tabId,
            window_id: tab.windowId,
            domain,
            protocol:
              urlObj.protocol.replace(":", ""),
            path: urlObj.pathname,
            is_secure:
              urlObj.protocol === "https:",
            human_readable:
              `Visite du domaine ${domain}.`,
            device_info: getDeviceInfo()
          }
        );
      }
    );
  }
);

/* 9) Onglets et TAB_COUNT */
chrome.tabs.onActivated.addListener(
  (activeInfo) => {
    chrome.tabs.get(
      activeInfo.tabId,
      (tab) => {
        if (chrome.runtime.lastError) return;

        updateActiveTimer(
          activeInfo.tabId,
          activeInfo.windowId,
          tab?.url,
          "tab_switch"
        );

        chrome.storage.local.get(
          ["preferences"],
          (res) => {
            const prefs = res.preferences || {};

            if (prefs.onglet) {
              const domain = getDomain(tab?.url);

              Tracker.track(
                "onglet",
                "TAB_SWITCH",
                {
                  tab_id: activeInfo.tabId,
                  window_id: activeInfo.windowId,
                  domain,
                  human_readable:
                    `Changement d’onglet vers ${domain || "un onglet interne"}.`,
                  device_info: getDeviceInfo()
                }
              );
            }

            if (prefs.nbOnglet) {
              chrome.tabs.query(
                {},
                (tabs) => {
                  Tracker.track(
                    "nb_onglet",
                    "TAB_COUNT",
                    {
                      count: tabs.length,
                      reason: "tab_switch",
                      human_readable:
                        `Nombre d’onglets ouverts : ${tabs.length}.`,
                      device_info: getDeviceInfo()
                    }
                  );
                }
              );
            }
          }
        );
      }
    );
  }
);

/* Changement de fenêtre */
chrome.windows.onFocusChanged.addListener(
  (windowId) => {
    if (
      windowId ===
      chrome.windows.WINDOW_ID_NONE
    ) {
      const endTime = Date.now();

      timerQueue = timerQueue
        .then(async () => {
          const result =
            await chrome.storage.local.get(
              TIMER_KEY
            );

          await recordTimeSpent(
            result[TIMER_KEY],
            "window_blur",
            endTime
          );

          await chrome.storage.local.remove(
            TIMER_KEY
          );
        })
        .catch((error) => {
          console.error(
            "Erreur du chronomètre :",
            error
          );
        });
    } else {
      chrome.tabs.query(
        {
          active: true,
          windowId
        },
        (tabs) => {
          const tab = tabs?.[0];

          if (tab) {
            updateActiveTimer(
              tab.id,
              tab.windowId,
              tab.url,
              "window_focus_change"
            );
          }
        }
      );
    }

    chrome.storage.local.get(
      ["preferences"],
      (res) => {
        if (!res.preferences?.nbOnglet) {
          return;
        }

        chrome.tabs.query(
          {},
          (tabs) => {
            Tracker.track(
              "nb_onglet",
              "TAB_COUNT",
              {
                count: tabs.length,
                reason:
                  "window_focus_change",
                human_readable:
                  `Nombre d’onglets ouverts : ${tabs.length}.`,
                device_info: getDeviceInfo()
              }
            );
          }
        );
      }
    );
  }
);

/* 10) Module Activité */
let activityAttached = false;
let lastActivityState = "active";
let lastActivityTimestamp = Date.now();

function initActivityModule() {
  if (activityAttached) return;

  chrome.storage.local.get(
    ["preferences"],
    (res) => {
      if (!res.preferences?.activite) return;

      activityAttached = true;

      const idleThresholdMs = 60000;

      chrome.idle.setDetectionInterval(
        idleThresholdMs / 1000
      );

      chrome.idle.onStateChanged.addListener(
        async (state) => {
          const now = Date.now();

          const durationIdleMs =
            state === "active"
              ? now - lastActivityTimestamp
              : 0;

          const durationIdleS =
            Math.round(durationIdleMs / 1000);

          const [tab] =
            await chrome.tabs.query({
              active: true,
              lastFocusedWindow: true
            });

          const windowFocused = Boolean(tab);
          const tabId = tab?.id || null;

          let eventName = "";
          let human = "";

          if (state === "idle") {
            eventName = "USER_BECAME_IDLE";
            human =
              "L’utilisateur est devenu inactif.";
          }

          if (state === "active") {
            eventName =
              "USER_RETURNED_ACTIVE";
            human =
              `L’utilisateur est redevenu actif après ${durationIdleS} secondes d’inactivité.`;
          }

          if (state === "locked") {
            eventName =
              "USER_SCREEN_LOCKED";
            human =
              "L’écran de l’utilisateur a été verrouillé.";
          }

          Tracker.track(
            "activite",
            eventName,
            {
              previous_state:
                lastActivityState,
              new_state: state,
              idle_threshold_s:
                idleThresholdMs / 1000,
              duration_idle_s:
                durationIdleS,
              window_focused:
                windowFocused,
              tab_id: tabId,
              activity_source:
                "chrome.idle",
              human_readable: human,
              device_info: getDeviceInfo()
            }
          );

          lastActivityState = state;
          lastActivityTimestamp = now;
        }
      );
    }
  );
}
