importScripts("tracker.js");

//  Gestion du consentement au démarrage 
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "consent.html" });
    }
});

chrome.storage.local.get(["consent"], res => {
    if (res.consent) {
        Tracker.init(res.consent);
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

let start = Date.now();

