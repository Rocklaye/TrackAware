const keys = [
  "url",
  "temps",
  "onglet",
  "nbOnglet",
  "periode",
  "ajout_supp",
  "activite"
];

/* ---------------------------------------------------------
   1) Pré-cocher les cases selon les préférences existantes
--------------------------------------------------------- */
chrome.storage.local.get(["preferences"], (res) => {
  const saved = res.preferences || {};

  keys.forEach((k) => {
    const el = document.getElementById(k);
    if (el) el.checked = Boolean(saved[k]);
  });
});

/* ---------------------------------------------------------
   2) Mise à jour en temps réel des préférences
--------------------------------------------------------- */
keys.forEach((k) => {
  const el = document.getElementById(k);
  if (!el) return;

  el.addEventListener("change", () => {
    chrome.storage.local.get(["preferences"], (res) => {
      const prefs = res.preferences || {};
      prefs[k] = el.checked;

      chrome.storage.local.set({ preferences: prefs }, () => {
        chrome.runtime.sendMessage({
          type: "PREFERENCES_UPDATE",
          preferences: prefs
        });
      });
    });
  });
});

/* ---------------------------------------------------------
   3) Fonction de sauvegarde globale (accept/refuse)
--------------------------------------------------------- */
function save(consentValue) {
  const preferences = {};
  keys.forEach(k => {
    const el = document.getElementById(k);
    preferences[k] = el ? el.checked : false;
  });

  const technicalData = {
    visitor_id: crypto.randomUUID(),
    session_id: Date.now(),
    timestamp: new Date().toISOString()
  };

  chrome.storage.local.set(
    {
      consent: consentValue,
      preferences,
      setup: technicalData
    },
    () => {
      chrome.runtime.sendMessage({
        type: "CONSENT_UPDATE",
        value: consentValue,
        preferences
      });

      window.close();
    }
  );
}

/* ---------------------------------------------------------
   4) Boutons Accepter / Refuser
--------------------------------------------------------- */
document.getElementById("accepter").addEventListener("click", () => {
  save("accepted");
});

document.getElementById("refuser").addEventListener("click", () => {
  keys.forEach(k => {
    const el = document.getElementById(k);
    if (el) el.checked = false;
  });

  save("refused");
});
