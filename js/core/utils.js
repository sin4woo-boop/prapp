function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(d) {
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h < 12 ? '오전' : '오후';
    const h12 = h % 12 || 12;
    return `${period} ${h12}:${String(m).padStart(2, '0')}`;
}

function getThisWeekMonSun() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
}

function isSameDay(a, b) {
    return dateKey(a) === dateKey(b);
}

// ===== 초기화 및 이벤트 리스너 =====
