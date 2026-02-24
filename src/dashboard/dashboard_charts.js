document.addEventListener("DOMContentLoaded", () => {

    // Bouton retour
    document.getElementById("btnBack").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    // Charger les logs et afficher le graphique
    function loadAndRender() {
        chrome.storage.local.get(["logs"], (res) => {
            const logs = res.logs || [];
            renderCharts(logs);
        });
    }

    loadAndRender();

    // Changement de graphique
    document.getElementById("chartSelector").addEventListener("change", loadAndRender);
});
