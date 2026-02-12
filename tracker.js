const Tracker = {
  consent: {},
  sessionId: null,
  visitorId: null,

  init(consent) {
    this.consent = consent || {};

    // On récupère les identifiants techniques générés à l'Étape 2
    chrome.storage.local.get(["setup"], res => {
      if (res.setup) {
        this.visitorId = res.setup.visitor_id;
        this.sessionId = res.setup.session_id;
      } else {
        // Sécurité au cas où le setup n'existe pas encore
        this.visitorId = "guest";
        this.sessionId = Date.now();
      }

      this.log("session_start");
    });
  },

  log(event, data = {}) {
    const entry = {
      time: new Date().toISOString(), // Format ISO pour être plus lisible 
      event: event.toUpperCase(), // Pour un log
      session_id: this.sessionId,
      visitor_id: this.visitorId,
      details: data // On regroupe les données sous "details" 
    };

    chrome.storage.local.get(["logs"], res => {
      const logs = res.logs || [];
      logs.push(entry);
      chrome.storage.local.set({ logs });
    });
  },

  track(type, event, data = {}) {
    // On vérifie si le module spécifique est accepté 
    if (!this.consent[type]) return;

    this.log(event, data);
  }
};