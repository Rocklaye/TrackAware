document.addEventListener("DOMContentLoaded", () => {
    const logsContainer = document.getElementById("logsContainer");
    const searchInput = document.getElementById("searchInput");
    const exportBtn = document.getElementById("exportBtn");
    const clearBtn = document.getElementById("clearBtn");
    const filterButtons = document.querySelectorAll(".filter-btn");

    let allLogs = [];
    let currentFilter = "all";
    let currentSearch = "";

    /* ---------------------------------------------------------
       1) Charger les logs depuis chrome.storage.local
    --------------------------------------------------------- */
    function loadLogs() {
        chrome.storage.local.get(["logs"], (res) => {
            allLogs = res.logs || [];
            renderLogs();
        });
    }

    /* ---------------------------------------------------------
       2) Appliquer filtre + recherche
    --------------------------------------------------------- */
    function getFilteredLogs() {
        return allLogs.filter((log) => {
            // Filtre par catégorie
            if (currentFilter !== "all" && log.category !== currentFilter) {
                return false;
            }

            // Recherche texte
            if (currentSearch.trim() !== "") {
                const q = currentSearch.toLowerCase();
                const haystack = JSON.stringify(log).toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }

    /* ---------------------------------------------------------
       3) Affichage des logs
    --------------------------------------------------------- */
    function renderLogs() {
        logsContainer.innerHTML = "";

        const logsToShow = getFilteredLogs();

        if (logsToShow.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = "Aucun log à afficher pour le moment.";
            logsContainer.appendChild(empty);
            return;
        }

        logsToShow.forEach((log) => {
            const entry = document.createElement("div");
            entry.className = "log-entry";

            /* ---------- HEADER ---------- */
            const header = document.createElement("div");
            header.className = "log-header";

            const left = document.createElement("div");

            // Catégorie (bleu)
            const catSpan = document.createElement("span");
            catSpan.className = "log-category";
            catSpan.textContent = (log.category || "").toUpperCase();

            // Event (gris clair)
            const eventSpan = document.createElement("span");
            eventSpan.className = "log-event";
            eventSpan.textContent = " - " + (log.event || "").toUpperCase();

            left.appendChild(catSpan);
            left.appendChild(eventSpan);

            // Timestamp
            const right = document.createElement("div");
            right.className = "log-timestamp";
            right.textContent = log.timestamp || "";

            header.appendChild(left);
            header.appendChild(right);

            /* ---------- DETAILS JSON ---------- */
            const details = document.createElement("div");
            details.className = "log-details";

            const pretty = JSON.stringify(log, null, 2);
            details.textContent = pretty;

            entry.appendChild(header);
            entry.appendChild(details);

            entry.addEventListener("click", () => {
                entry.classList.toggle("open");
            });

            logsContainer.appendChild(entry);
        });
    }

    /* ---------------------------------------------------------
       4) Gestion des filtres
    --------------------------------------------------------- */
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentFilter = btn.dataset.filter || "all";
            renderLogs();
        });
    });

    /* ---------------------------------------------------------
       5) Recherche
    --------------------------------------------------------- */
    searchInput.addEventListener("input", () => {
        currentSearch = searchInput.value;
        renderLogs();
    });

    /* ---------------------------------------------------------
       6) Export JSON
    --------------------------------------------------------- */
    exportBtn.addEventListener("click", () => {
        const logsToExport = getFilteredLogs();
        const blob = new Blob([JSON.stringify(logsToExport, null, 2)], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trackaware_logs.json";
        a.click();
        URL.revokeObjectURL(url);
    });

    /* ---------------------------------------------------------
       7) Effacer les logs
    --------------------------------------------------------- */
    clearBtn.addEventListener("click", () => {
        if (!confirm("Voulez-vous vraiment effacer tous les logs ?")) return;

        chrome.storage.local.set({ logs: [] }, () => {
            allLogs = [];
            renderLogs();
        });
    });

    /* ---------------------------------------------------------
       8) Init
    --------------------------------------------------------- */
    loadLogs();
});
