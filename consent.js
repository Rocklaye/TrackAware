const keys =[
    "url",
    "temps",
    "onglet",
    "nbOnglet",
    "periode",
    "ajout_supp",
    "activite"

];
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