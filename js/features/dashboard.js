function openDashboard() {
    try {
        renderDashboard();
    } catch (e) {
        console.error("Dashboard Render Error:", e);
    }
    document.getElementById("home-screen").classList.add("hidden");
    document.getElementById("dashboard-screen").classList.remove("hidden");
}

let dailyLineChartInstance = null;

function closeDashboard() {
    document.getElementById("dashboard-screen").classList.add("hidden");
    document.getElementById("home-screen").classList.remove("hidden");
}

function renderDashboard() {
    renderBestDay();
    renderCumulativePoints();
    renderWeeklyAverage();
    renderDailyLineChart();
    renderTotalGifts();
    renderTotalPraise();
    renderTotalCaution();
    renderDaysInProgress();
    renderGiftHistory();
    renderTopMissions();
}

function getLegacyJson(key, fallback = {}) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (_) {
        return fallback;
    }
}

function renderCumulativePoints() {
    const el = document.getElementById("cumulative-score");
    if (!el) return;

    let totalEarned = 0;
    let hasData = false;

    if (state.activitiesByDate) {
        Object.values(state.activitiesByDate).forEach(dayActivities => {
            totalEarned += dayActivities
                .filter(a => a.pts > 0)
                .reduce((sum, a) => sum + a.pts, 0);
            if (dayActivities.length > 0) hasData = true;
        });
    }

    if (state.goalHistory) {
        state.goalHistory.forEach(item => {
            totalEarned += item.reward || 0;
        });
    }

    if (totalEarned === 0 && !hasData) {
        const directTotal = localStorage.getItem("totalScore");
        if (directTotal) {
            totalEarned = parseInt(directTotal, 10) || 0;
            hasData = true;
        }
    }

    if (totalEarned === 0 && !hasData) {
        const stats = getLegacyJson("移?갔??븘由??듦퀎");
        if (stats.totalScore) totalEarned = stats.totalScore;
    }

    el.textContent = `${totalEarned.toLocaleString()}P`;
}

function renderBestDay() {
    let bestScore = 0;
    let bestDate = null;
    let hasData = false;

    if (state.activitiesByDate) {
        Object.keys(state.activitiesByDate).forEach(key => {
            const dayScore = state.activitiesByDate[key]
                .filter(a => a.pts > 0)
                .reduce((sum, a) => sum + a.pts, 0);

            if (dayScore > bestScore) {
                bestScore = dayScore;
                bestDate = key;
            }
            hasData = true;
        });
    }

    if (bestScore === 0 && !hasData) {
        const directMax = localStorage.getItem("maxDailyScore");
        if (directMax) {
            bestScore = parseInt(directMax, 10) || 0;
            hasData = true;
        }
    }

    if (bestScore === 0 && !hasData) {
        const stats = getLegacyJson("移?갔??븘由??듦퀎");
        if (stats.maxScore) bestScore = stats.maxScore;
    }

    const scoreEl = document.getElementById("best-day-score");
    const dateEl = document.getElementById("best-day-date");
    if (scoreEl) scoreEl.textContent = `${bestScore || 0}P`;

    if (dateEl && bestDate) {
        const d = new Date(bestDate);
        dateEl.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    } else if (dateEl) {
        dateEl.textContent = "-";
    }
}

function renderWeeklyAverage() {
    const el = document.getElementById("weekly-average-score");
    if (!el) return;

    const now = new Date();
    let totalScore = 0;

    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (state.activitiesByDate && state.activitiesByDate[key]) {
            const score = state.activitiesByDate[key]
                .filter(a => a.pts > 0)
                .reduce((sum, a) => sum + a.pts, 0);
            totalScore += score;
        }
    }

    const avg = Math.round(totalScore / 7);
    el.textContent = `${avg}P`;
}

function renderDailyLineChart() {
    if (typeof Chart === "undefined") return;

    const ctx = document.getElementById("daily-line-chart");
    if (!ctx) return;

    if (dailyLineChartInstance) dailyLineChartInstance.destroy();

    const labels = [];
    const dataPoints = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = `${d.getMonth() + 1}/${d.getDate()}`;

        let score = 0;
        if (state.activitiesByDate && state.activitiesByDate[key]) {
            score = state.activitiesByDate[key]
                .filter(a => a.pts > 0)
                .reduce((sum, a) => sum + a.pts, 0);
        }

        labels.push(label);
        dataPoints.push(score);
    }

    dailyLineChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "일일 획득 포인트",
                data: dataPoints,
                borderColor: "#6366F1",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#6366F1",
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 8,
                    right: 10,
                    bottom: 8,
                    left: 6
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label(context) {
                            return `획득: ${context.parsed.y}P`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0, 0, 0, 0.05)", borderDash: [2, 4] },
                    ticks: { precision: 0, color: "#94a3b8", font: { weight: "bold" } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { weight: "bold" } }
                }
            }
        }
    });
}

function renderTotalGifts() {
    const el = document.getElementById("total-gifts-count");
    if (el) el.innerText = `${state.purchaseHistory ? state.purchaseHistory.length : 0}건`;
}

function renderTotalPraise() {
    const el = document.getElementById("total-praise-count");
    if (!el) return;
    const count = Object.entries(state.missionCounts || {})
        .filter(([label]) => {
            const m = state.missions.find(mm => mm.label === label);
            return m && m.pts > 0;
        })
        .reduce((sum, [, c]) => sum + c, 0);
    el.innerText = `${count}회`;
}

function renderTotalCaution() {
    const el = document.getElementById("total-caution-count");
    if (!el) return;
    const count = Object.entries(state.missionCounts || {})
        .filter(([label]) => {
            const m = state.missions.find(mm => mm.label === label);
            return m && m.pts < 0;
        })
        .reduce((sum, [, c]) => sum + c, 0);
    el.innerText = `${count}회`;
}

function renderDaysInProgress() {
    const el = document.getElementById("days-in-progress");
    if (!el) return;
    const dates = Object.keys(state.activitiesByDate || {}).sort();
    if (dates.length === 0) {
        el.innerText = "0일";
        return;
    }
    const start = new Date(dates[0]);
    const today = new Date();
    const diff = Math.ceil((today - start) / (1000 * 60 * 60 * 24)) || 1;
    el.innerText = `${diff}일`;
}

function renderTopMissions() {
    const container = document.getElementById("top-missions-good");
    if (!container) return;
    container.innerHTML = "";

    let counts = Object.entries(state.missionCounts || {});
    if (counts.length === 0) {
        const savedStats = getLegacyJson("missionStats");
        counts = Object.entries(savedStats);
    }

    const sortedMissions = counts.sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (sortedMissions.length === 0) {
        container.innerHTML = '<p class="text-white/80 font-bold text-center py-4">아직 기록이 없어요</p>';
        return;
    }

    sortedMissions.forEach(([label, count]) => {
        const item = document.createElement("div");
        item.className = "top-mission-item";

        const missionData = state.missions.find(m => m.label === label);
        const icon = missionData ? missionData.icon : "star";

        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-[#F0F2F5] flex items-center justify-center">
                    <i class="ph ${getPhosphorIconClass(icon)} text-gray-700 text-2xl"></i>
                </div>
                <span class="text-xl font-bold text-gray-800">${label}</span>
            </div>
            <div class="text-2xl font-black text-gray-900">${count}<span class="text-sm text-gray-400 ml-1 font-bold">회</span></div>
        `;
        container.appendChild(item);
    });
}

function renderGiftHistory() {
    const list = document.getElementById("gift-purchase-history");
    if (!list) return;
    list.innerHTML = "";

    let history = [...(state.purchaseHistory || [])];
    if (history.length === 0) {
        const saved = getLegacyJson("移?갔??븘由?援щℓ?댁뿭", []);
        if (saved.length > 0) {
            history = saved.map(item => ({
                date: item.date || new Date().toISOString(),
                name: item.name,
                cost: item.points || 0
            }));
        }
    }

    const reversedHistory = [...history].reverse();

    if (reversedHistory.length === 0) {
        list.className = "space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar flex items-center justify-center";
        list.innerHTML = '<p class="text-gray-300 font-bold text-center">아직 받은 선물이 없어요</p>';
        return;
    }

    list.className = "space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar";

    reversedHistory.forEach(item => {
        const h = document.createElement("div");
        h.className = "history-item";

        const d = new Date(item.date);
        let dateStr = item.date;
        if (!isNaN(d.getTime())) dateStr = `${d.getMonth() + 1}.${d.getDate()}`;

        h.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="text-sm font-bold text-gray-400 w-10">${dateStr}</span>
                <span class="font-bold text-gray-800">${item.name}</span>
            </div>
            <span class="font-black text-rose-500">-${(item.cost || 0).toLocaleString()}P</span>
        `;
        list.appendChild(h);
    });
}

function openFullHistory(type) {
    const modal = document.getElementById("history-full-modal");
    const title = document.getElementById("history-full-title");
    const list = document.getElementById("history-full-list");
    if (!modal || !title || !list) return;

    list.innerHTML = "";
    const items = type === "gift" ? [...(state.purchaseHistory || [])].reverse() : [...(state.goalHistory || [])].reverse();
    const typeLabel = type === "gift" ? "선물 구매 내역" : "목표 달성 기록";
    title.textContent = `${typeLabel} (총 ${items.length}개)`;

    if (items.length === 0) {
        list.innerHTML = `<div class="h-64 flex flex-col items-center justify-center opacity-30">
            <span class="material-symbols-rounded text-9xl mb-4">history_toggle_off</span>
            <p class="text-3xl font-black">내역이 아직 없어요</p>
        </div>`;
    } else {
        items.forEach(item => {
            const el = document.createElement("div");
            el.className = "flex items-center gap-6 p-6 rounded-[32px] bg-gray-50 border-2 border-gray-100 shadow-sm";
            const d = new Date(item.date);
            const dateStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

            if (type === "gift") {
                el.innerHTML = `
                    <div class="text-5xl shrink-0">🛍️</div>
                    <div class="flex-1 flex items-center justify-between min-w-0 gap-6">
                        <p class="text-2xl font-black text-gray-900 truncate">${item.name}</p>
                        <div class="flex items-center gap-4 shrink-0">
                            <p class="text-lg font-bold text-gray-500">${dateStr}</p>
                            <p class="text-3xl font-black text-blue-600">-${(item.cost || 0).toLocaleString()}P</p>
                        </div>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <div class="text-5xl shrink-0">🎯</div>
                    <div class="flex-1 flex items-center justify-between min-w-0 gap-6">
                        <p class="text-2xl font-black text-gray-900 truncate">${item.goal}</p>
                        <div class="flex items-center gap-4 shrink-0">
                            <p class="text-lg font-bold text-gray-500">${dateStr}</p>
                            <p class="text-3xl font-black text-purple-600">+${(item.reward || 0).toLocaleString()}P</p>
                        </div>
                    </div>
                `;
            }
            list.appendChild(el);
        });
    }

    modal.classList.remove("hidden");
}

function closeFullHistory() {
    const modal = document.getElementById("history-full-modal");
    if (modal) modal.classList.add("hidden");
}
