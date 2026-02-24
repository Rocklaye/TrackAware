/* ---------------------------------------------------------
   Chart.js – Visualisations du Dashboard TrackAware
--------------------------------------------------------- */

/* ---------- Histogramme par catégorie ---------- */
function renderCategoryHistogram(logs) {
    const counts = {};

    logs.forEach(log => {
        counts[log.category] = (counts[log.category] || 0) + 1;
    });

    const canvas = document.createElement("canvas");
    canvas.id = "chartCategories";
    document.getElementById("chartsContainer").appendChild(canvas);

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Nombre de logs",
                data: Object.values(counts),
                backgroundColor: "#007acc"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#d4d4d4" } },
                y: { ticks: { color: "#d4d4d4" } }
            }
        }
    });
}

/* ---------- Évolution des logs dans le temps ---------- */
function renderLogsOverTime(logs) {
    const perHour = {};

    logs.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        perHour[hour] = (perHour[hour] || 0) + 1;
    });

    const hours = [...Array(24).keys()];
    const values = hours.map(h => perHour[h] || 0);

    const canvas = document.createElement("canvas");
    canvas.id = "chartTimeline";
    document.getElementById("chartsContainer").appendChild(canvas);

    new Chart(canvas, {
        type: "line",
        data: {
            labels: hours.map(h => `${h}h`),
            datasets: [{
                label: "Logs par heure",
                data: values,
                borderColor: "#ffb347",
                backgroundColor: "rgba(255,180,71,0.2)",
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#d4d4d4" } },
                y: { ticks: { color: "#d4d4d4" } }
            }
        }
    });
}

/* ---------- Temps passé par domaine ---------- */
function renderTimeSpentByDomain(logs) {
    const durations = {};

    logs.filter(l => l.category === "TEMPS").forEach(l => {
        const domain = l.details?.domain || "inconnu";
        durations[domain] = (durations[domain] || 0) + (l.details.duration_s || 0);
    });

    if (Object.keys(durations).length === 0) return;

    const canvas = document.createElement("canvas");
    canvas.id = "chartTimeSpent";
    document.getElementById("chartsContainer").appendChild(canvas);

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(durations),
            datasets: [{
                label: "Temps passé (s)",
                data: Object.values(durations),
                backgroundColor: "#6dd47e"
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#d4d4d4" } },
                y: { ticks: { color: "#d4d4d4" } }
            }
        }
    });
}

/* ---------- Pie Chart : Répartition des domaines ---------- */
function renderPieDomains(logs) {
    const counts = {};

    logs.filter(l => l.category === "URL").forEach(l => {
        const domain = l.details?.domain || "inconnu";
        counts[domain] = (counts[domain] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) return;

    const canvas = document.createElement("canvas");
    canvas.id = "chartPieDomains";
    document.getElementById("chartsContainer").appendChild(canvas);

    new Chart(canvas, {
        type: "pie",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: [
                    "#007acc", "#ffb347", "#6dd47e",
                    "#d9534f", "#9b59b6", "#f1c40f"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#d4d4d4" }
                }
            }
        }
    });
}

/* ---------- Heatmap d’activité (Jour × Heure) ---------- */
function renderHeatmap(logs) {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));

    logs.forEach(log => {
        const d = new Date(log.timestamp);
        const day = (d.getDay() + 6) % 7;
        const hour = d.getHours();
        matrix[day][hour]++;
    });

    const container = document.getElementById("chartsContainer");
    const heatmap = document.createElement("div");
    heatmap.className = "heatmap";

    for (let day = 0; day < 7; day++) {
        const label = document.createElement("div");
        label.className = "heatmap-day-label";
        label.textContent = days[day];
        heatmap.appendChild(label);

        const row = document.createElement("div");
        row.className = "heatmap-row";

        for (let hour = 0; hour < 24; hour++) {
            const value = matrix[day][hour];
            const cell = document.createElement("div");
            cell.className = "heatmap-cell";

            const intensity = Math.min(value / 10, 1);
            cell.style.backgroundColor = `rgba(0, 122, 204, ${intensity})`;

            cell.title = `${days[day]} ${hour}h : ${value} logs`;

            row.appendChild(cell);
        }

        heatmap.appendChild(row);
    }

    container.appendChild(heatmap);
}



/* ---------- Fonction principale ---------- */
function renderCharts(logs) {
    const container = document.getElementById("chartsContainer");
    container.innerHTML = "";

    const choice = document.getElementById("chartSelector").value;

    if (choice === "categories") renderCategoryHistogram(logs);
    else if (choice === "timeline") renderLogsOverTime(logs);
    else if (choice === "domains") renderTimeSpentByDomain(logs);
    else if (choice === "pie") renderPieDomains(logs);
    else if (choice === "heatmap") renderHeatmap(logs);
}


