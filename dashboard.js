document.addEventListener("DOMContentLoaded", () => {

    /* ---------------------------------------------------------
       Chargement initial des données
    --------------------------------------------------------- */
    chrome.storage.local.get(["logs", "preferences", "consent"], (res) => {
        const logs = res.logs || [];
        renderLogs(logs);
        populateFilters(logs);
        computeInsights(logs);
    });

    /* ---------------------------------------------------------
       Mise à jour en temps réel (background → dashboard)
    --------------------------------------------------------- */
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "REFRESH_DASHBOARD") {
            location.reload();
        }
    });

    /* ---------------------------------------------------------
       Rendu du tableau des logs
    --------------------------------------------------------- */
    function renderLogs(logs) {
        const tbody = document.querySelector("#logsTable tbody");
        tbody.innerHTML = "";

        logs.forEach(log => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${new Date(log.time).toLocaleString()}</td>
                <td>${log.event}</td>
                <td>${JSON.stringify(log.details)}</td>
                <td>${log.session_id}</td>
                <td>${log.visitor_id}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    /* ---------------------------------------------------------
       Filtres dynamiques
    --------------------------------------------------------- */
    function populateFilters(logs) {
        const eventTypes = [...new Set(logs.map(l => l.event))];
        const sessions = [...new Set(logs.map(l => l.session_id))];
        const visitors = [...new Set(logs.map(l => l.visitor_id))];

        fillSelect("filterEventType", eventTypes);
        fillSelect("filterSession", sessions);
        fillSelect("filterVisitor", visitors);
    }

    function fillSelect(id, values) {
        const select = document.getElementById(id);
        values.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            select.appendChild(opt);
        });
    }

    /* ---------------------------------------------------------
       Insights intelligents
    --------------------------------------------------------- */
    function computeInsights(logs) {
        const insights = [];

        // 1) Heures d’activité
        const hours = logs.map(l => new Date(l.time).getHours());
        const night = hours.filter(h => h >= 21 || h < 6).length;
        const nightPct = Math.round((night / hours.length) * 100);

        insights.push(`🌙 Activité nocturne : ${nightPct}% des événements après 21h`);

        // 2) Domaine le plus visité
        const domains = logs
            .filter(l => l.event === "DOMAIN_VISIT")
            .map(l => l.details.domain);

        if (domains.length > 0) {
            const freq = {};
            domains.forEach(d => freq[d] = (freq[d] || 0) + 1);

            const top = Object.entries(freq).sort((a,b) => b[1] - a[1])[0];
            insights.push(`🌐 Domaine le plus visité : ${top[0]} (${top[1]} visites)`);
        }

        // 3) Temps passé
        const times = logs.filter(l => l.event === "TIME_SPENT");
        if (times.length > 0) {
            const total = times.reduce((sum, l) => sum + l.details.duration_ms, 0);
            const minutes = Math.round(total / 60000);
            insights.push(`⏱ Temps total passé sur les sites : ${minutes} minutes`);
        }

        // 4) Inactivité
        const idle = logs.filter(l => l.event === "USER_IDLE").length;
        const idlePct = Math.round((idle / logs.length) * 100);
        insights.push(`😴 Inactivité détectée : ${idlePct}% des événements`);

        // 5) Score de confiance
        const score = Math.min(100, Math.round((logs.length / 50) * 100));
        insights.push(`📈 Score de confiance : ${score}%`);

        // Affichage
        const ul = document.getElementById("insights");
        insights.forEach(i => {
            const li = document.createElement("li");
            li.textContent = i;
            ul.appendChild(li);
        });
    }
});
