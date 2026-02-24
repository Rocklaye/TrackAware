document.addEventListener("DOMContentLoaded", () => {
    const logsContainer = document.getElementById("logsContainer");
    const searchInput = document.getElementById("searchInput");
    const exportBtn = document.getElementById("exportBtn");
    const clearBtn = document.getElementById("clearBtn");
    const filterButtons = document.querySelectorAll(".filter-btn");

    const timeFilter = document.getElementById("timeFilter");
    const limitFilter = document.getElementById("limitFilter");

    // Navigation
    document.getElementById("btnCharts").addEventListener("click", () => {
        window.location.href = "dashboard_charts.html";
    });

    document.getElementById("btnLogs").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    let allLogs = [];
    let currentFilter = "all";
    let currentSearch = "";

    /* ---------------------------------------------------------
       Formatage lisible de l'horodatage
    --------------------------------------------------------- */
    function formatTimestamp(ts) {
        const date = new Date(ts);
        return date.toLocaleString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).replace(",", " à");
    }

    /* ---------------------------------------------------------
       Charger les logs
    --------------------------------------------------------- */
    function loadLogs() {
        chrome.storage.local.get(["logs"], (res) => {
            allLogs = res.logs || [];
            updateStats();
            renderLogs();
        });
    }

    /* ---------------------------------------------------------
       Compteurs par catégorie
    --------------------------------------------------------- */
    function updateStats() {
        const statsBar = document.getElementById("statsBar");
        const counts = {};

        allLogs.forEach(log => {
            counts[log.category] = (counts[log.category] || 0) + 1;
        });

        statsBar.innerHTML = Object.entries(counts)
            .map(([cat, count]) => `<div class="stats-item">${cat}: ${count}</div>`)
            .join("");
    }

    /* ---------------------------------------------------------
       Filtrage
    --------------------------------------------------------- */
    function getFilteredLogs() {
        return allLogs.filter((log) => {

            if (currentFilter !== "all" && log.category !== currentFilter) return false;

            if (currentSearch.trim() !== "") {
                const q = currentSearch.toLowerCase();
                const haystack = JSON.stringify(log).toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            if (timeFilter.value !== "all") {
                const now = Date.now();
                const ts = new Date(log.timestamp).getTime();

                if (timeFilter.value === "1h" && now - ts > 3600000) return false;
                if (timeFilter.value === "24h" && now - ts > 86400000) return false;

                if (timeFilter.value === "today") {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (ts < today.getTime()) return false;
                }

                if (timeFilter.value === "week") {
                    const weekAgo = now - 7 * 86400000;
                    if (ts < weekAgo) return false;
                }

                if (timeFilter.value === "month") {
                    const monthAgo = now - 30 * 86400000;
                    if (ts < monthAgo) return false;
                }
            }

            return true;
        });
    }

    /* ---------------------------------------------------------
       Affichage des logs
    --------------------------------------------------------- */
    function renderLogs() {
        logsContainer.innerHTML = "";

        let logsToShow = getFilteredLogs();

        if (limitFilter.value !== "all") {
            const limit = parseInt(limitFilter.value);
            logsToShow = logsToShow.slice(-limit);
        }

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

            const header = document.createElement("div");
            header.className = "log-header";

            const left = document.createElement("div");

            const catSpan = document.createElement("span");
            catSpan.className = "log-category";
            catSpan.textContent = (log.category || "").toUpperCase();

            const eventSpan = document.createElement("span");
            eventSpan.className = "log-event";
            eventSpan.textContent = " - " + (log.event || "").toUpperCase();

            left.appendChild(catSpan);
            left.appendChild(eventSpan);

            const right = document.createElement("div");
            right.className = "log-timestamp";
            right.textContent = formatTimestamp(log.timestamp);

            header.appendChild(left);
            header.appendChild(right);

            const details = document.createElement("div");
            details.className = "log-details";
            details.textContent = JSON.stringify(log, null, 2);

            entry.appendChild(header);
            entry.appendChild(details);

            entry.addEventListener("click", () => {
                entry.classList.toggle("open");
            });

            logsContainer.appendChild(entry);
        });
    }

    /* ---------------------------------------------------------
       Filtres
    --------------------------------------------------------- */
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentFilter = btn.dataset.filter || "all";
            renderLogs();
        });
    });

    searchInput.addEventListener("input", () => {
        currentSearch = searchInput.value;
        renderLogs();
    });

    timeFilter.addEventListener("change", renderLogs);
    limitFilter.addEventListener("change", renderLogs);

    /* ---------------------------------------------------------
       Export JSON
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
       Effacer les logs
    --------------------------------------------------------- */
    clearBtn.addEventListener("click", () => {
        if (!confirm("Voulez-vous vraiment effacer tous les logs ?")) return;

        chrome.storage.local.set({ logs: [] }, () => {
            allLogs = [];
            updateStats();
            renderLogs();
        });
    });

    /* ---------------------------------------------------------
       Init
    --------------------------------------------------------- */
    loadLogs();
});
