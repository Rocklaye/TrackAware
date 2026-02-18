const keys =[
    "url",
    "temps",
    "onglet",
    "nbOnglet",
    "periode",
    "ajout_supp",
    "activite"

];

// 🔄 Pré-cocher les cases selon le consentement sauvegardé
chrome.storage.local.get(["consent"], (res) => {
  const saved = res.consent;
  if (!saved) return;

  keys.forEach((k) => {
    const el = document.getElementById(k);
    if (el) el.checked = !!saved[k];
  });
});

//Sauvegarder le choix de l'utilisateur et le rediriger vers popup
function save(consent) {
  // Ajoute des données techniques obligatoires ici 
  const technicalData = {
    visitor_id: self.crypto.randomUUID(), // UUID 
    session_id: Date.now(), // Un ID de session basé sur le temps 
    timestamp: new Date().toISOString() // Timestamp 
  };
  chrome.storage.local.set({ consent, setup: technicalData }, () =>  {
    window.location.href = "popup.html";
  });
}
document.getElementById("accepter").onclick = () => {

  const consent = {};

  keys.forEach(k => {
    consent[k] = document.getElementById(k).checked;
  });

  save(consent);

};

document.getElementById("refuser").onclick = () => {

  const consent = {};

  keys.forEach(k => consent[k] = false);

  save(consent);

};
