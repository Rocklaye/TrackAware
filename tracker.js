export const Tracker = {
  consent: "refused",
  preferences: {},
  sessionId: null,
  visitorId: null,
  eventIndex: 0,

  /* ---------------------------------------------------------
     Initialisation du tracker
  --------------------------------------------------------- */
  init(consent, preferences = {}) {
    this.consent = consent;
    this.preferences = preferences;

    chrome.storage.local.get(["setup"], (res) => {
      if (res.setup) {
        this.visitorId = res.setup.visitor_id;
        this.sessionId = res.setup.session_id;
      } else {
        this.visitorId = crypto.randomUUID();
        this.sessionId = Date.now();
      }

      this.log("SYSTEM", "SESSION_START", {});
    });
  },

  /* ---------------------------------------------------------
     Mise à jour du consentement
  --------------------------------------------------------- */
  updateConsent(consent, preferences = {}) {
    this.consent = consent;
    this.preferences = preferences;
  },

  updatePreferences(preferences = {}) {
    this.preferences = preferences;
  },

  /* ---------------------------------------------------------
     Log normalisé (format SIEM)
  --------------------------------------------------------- */
  log(category, event, details = {}) {
    const entry = {
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category,
      event,
      session_id: this.sessionId,
      visitor_id: this.visitorId,
      session_event_index: this.eventIndex++,
      extension_version: chrome.runtime.getManifest().version,
      details
    };

    chrome.storage.local.get(["logs"], (res) => {
      const logs = res.logs || [];
      logs.push(entry);

      chrome.storage.local.set({ logs }, () => {
        chrome.runtime.sendMessage({ type: "REFRESH_DASHBOARD" });
      });
    });
  },

  /* ---------------------------------------------------------
     Tracking conditionnel selon préférences
  --------------------------------------------------------- */
  track(type, event, details = {}) {
    if (this.consent !== "accepted") return;
    if (!this.preferences[type]) return;

    this.log(type.toUpperCase(), event, details);
  }
};
