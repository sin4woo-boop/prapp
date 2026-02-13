const MISSION_PHOSPHOR_MAP = {
    menu_book: 'ph-book-open',
    piano: 'ph-piano-keys',
    cleaning_services: 'ph-broom',
    volunteer_activism: 'ph-hand-heart',
    school: 'ph-graduation-cap',
    fitness_center: 'ph-barbell',
    shower: 'ph-shower',
    restaurant: 'ph-fork-knife',
    favorite: 'ph-heart',
    bedtime: 'ph-moon',
    group_off: 'ph-warning-circle',
    home_repair_service: 'ph-trash',
    explicit: 'ph-chat-text',
    cancel: 'ph-x-circle',
    soap: 'ph-bathtub',
    bedtime_off: 'ph-moon-stars',
    volume_off: 'ph-speaker-slash',
    warning: 'ph-warning',
    add_circle: 'ph-plus-circle',
    remove_circle: 'ph-minus-circle'
};

function getPhosphorIconClass(iconKey) {
    return MISSION_PHOSPHOR_MAP[iconKey] || 'ph-circle';
}

window.getPhosphorIconClass = getPhosphorIconClass;
function renderMissions() {
    const grid = document.getElementById('mission-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.missions.forEach(mission => {
        const card = document.createElement('div');
        const isPositive = mission.pts >= 0;

        // 부드러운 컬러 베리에이션 테마 추출 (Premium 테마와 매핑)
        const posThemes = ['blue', 'indigo', 'violet', 'purple', 'skyblue'];
        const negThemes = ['rose', 'red', 'orange', 'amber', 'fuchsia'];

        const themeList = isPositive ? posThemes : negThemes;
        const selectedTheme = themeList[mission.id % themeList.length];

        card.className = `mission-card card flex flex-col items-center justify-center text-center premium-${selectedTheme} ${isPositive ? 'mission-positive' : 'mission-negative'}`;
        card.onclick = () => completeMission(mission);

        card.innerHTML = `
            <div class="mission-card-header">
                <div class="mission-card-icon-wrap">
                    <i class="ph ${getPhosphorIconClass(mission.icon)} mission-card-icon" aria-hidden="true"></i>
                </div>
                <p class="mission-card-score">
                    ${mission.pts > 0 ? '+' : ''}${mission.pts}P
                </p>
            </div>
            <p class="mission-card-label">${mission.label}</p>
        `;

        grid.appendChild(card);
    });

    const utilityMissions = [
        {
            id: 'custom-plus',
            icon: 'add_circle',
            label: '자율 추가',
            pts: '+점수',
            className: 'mission-custom-plus',
            onclick: () => openCustomScoreModal(true)
        },
        {
            id: 'custom-minus',
            icon: 'remove_circle',
            label: '자율 차감',
            pts: '-점수',
            className: 'mission-custom-minus',
            onclick: () => openCustomScoreModal(false)
        }
    ];

    utilityMissions.forEach((item) => {
        const card = document.createElement('div');
        card.className = `mission-card mission-custom-card card flex flex-col items-center justify-center text-center ${item.className}`;
        card.onclick = item.onclick;

        card.innerHTML = `
            <div class="mission-card-header">
                <div class="mission-card-icon-wrap">
                    <i class="ph ${getPhosphorIconClass(item.icon)} mission-card-icon" aria-hidden="true"></i>
                </div>
                <p class="mission-card-score">${item.pts}</p>
            </div>
            <p class="mission-card-label">${item.label}</p>
        `;

        grid.appendChild(card);
    });
}

// ===== 미션 완료 =====

function completeMission(mission) {
    const isPenalty = mission.pts < 0;
    const today = dateKey(new Date());

    // 활동 기록
    if (!state.activitiesByDate[today]) {
        state.activitiesByDate[today] = [];
    }

    state.activitiesByDate[today].push({
        id: Date.now(),
        label: mission.label,
        icon: mission.icon,
        pts: mission.pts,
        time: formatTime(new Date())
    });

    // 점수 업데이트
    state.score += mission.pts;

    // 미션 카운트
    if (!state.missionCounts[mission.label]) {
        state.missionCounts[mission.label] = 0;
    }
    state.missionCounts[mission.label]++;

    if (mission.pts > 0) {
        checkBadgeUnlock(mission.label);
        checkGoalProgress(mission.label);
    }

    saveData();
    updateUI();
    renderWeek();
    showMissionCompleteModal(mission, isPenalty);
}

async function openCustomScoreModal(isPositive) {
    const modeLabel = isPositive ? '점수 추가' : '점수 차감';
    const title = isPositive ? '자율 점수 추가' : '자율 점수 차감';
    const icon = isPositive ? '➕' : '➖';

    const label = await showCustomModal({
        title: `${title} ${icon}`,
        message: `${modeLabel} 내용을 입력해 주세요.`,
        type: 'prompt',
        placeholder: isPositive ? '예: 보너스 칭찬' : '예: 추가 경고',
        inputType: 'text'
    });

    if (!label) return;

    const ptsRaw = await showCustomModal({
        title: `${title} 수치`,
        message: `${modeLabel} 점수를 입력해 주세요. (1~100)`,
        type: 'prompt',
        placeholder: '1~100',
        inputType: 'number'
    });

    const absPts = parseInt(ptsRaw, 10);
    if (!absPts || absPts < 1 || absPts > 100) {
        showToast('점수는 1~100 사이로 입력해 주세요');
        return;
    }

    const confirmed = await showCustomModal({
        title: '최종 확인',
        message: `${label.trim()}\n${isPositive ? '+' : '-'}${absPts}P 적용할까요?`,
        type: 'confirm',
        icon: isPositive ? '➕' : '➖'
    });

    if (!confirmed) return;

    applyCustomScore({
        label: label.trim(),
        pts: isPositive ? absPts : -absPts,
        icon: isPositive ? 'add_circle' : 'remove_circle'
    });
}

function applyCustomScore(entry) {
    const today = dateKey(new Date());
    if (!state.activitiesByDate[today]) {
        state.activitiesByDate[today] = [];
    }

    state.activitiesByDate[today].push({
        id: Date.now(),
        label: entry.label,
        icon: entry.icon,
        pts: entry.pts,
        time: formatTime(new Date()),
        custom: true
    });

    state.score += entry.pts;
    saveData();
    updateUI();
    renderWeek();
    showToast(`${entry.label} ${entry.pts > 0 ? '+' : ''}${entry.pts}P 반영 완료`);
}

// ===== 미션 완료 팝업 (랜덤 스타일) =====

function showMissionCompleteModal(mission, isPenalty) {
    const modal = document.getElementById('mission-complete-modal');
    const content = document.getElementById('mission-complete-content');
    const pointText = `${mission.pts > 0 ? '+' : ''}${mission.pts}P`;

    const styles = isPenalty ? [
        {
            iconClass: 'ph-warning-circle',
            title: '아쉬워요',
            message: `${mission.label} 활동이 반영됐어요.`,
            headlineClass: 'mission-result-headline penalty'
        },
        {
            iconClass: 'ph-smiley-sad',
            title: '아쉬워요',
            message: '다음에는 더 잘할 수 있어요.',
            headlineClass: 'mission-result-headline penalty'
        }
    ] : [
        {
            iconClass: getPhosphorIconClass(mission.icon),
            title: '대단해요!',
            message: `${mission.label} 활동으로 포인트를 획득했어요.`,
            headlineClass: 'mission-result-headline success'
        },
        {
            iconClass: 'ph-star',
            title: '멋져요!',
            message: '정말 잘했어요!',
            headlineClass: 'mission-result-headline success'
        },
        {
            iconClass: 'ph-trophy',
            title: '최고예요!',
            message: '계속 이렇게 해봐요!',
            headlineClass: 'mission-result-headline success'
        },
        {
            iconClass: 'ph-seal-check',
            title: '훌륭해요!',
            message: `${mission.label} 성공!`,
            headlineClass: 'mission-result-headline success'
        }
    ];

    const style = styles[Math.floor(Math.random() * styles.length)];
    content.classList.remove('tone-success', 'tone-penalty');
    content.classList.add('mission-result-card', isPenalty ? 'tone-penalty' : 'tone-success');

    content.innerHTML = `
        <div class="mission-result-icon mb-5 text-gray-900">
            <i class="ph ${style.iconClass}" aria-hidden="true"></i>
        </div>
        <p class="mission-result-points ${isPenalty ? 'penalty' : 'success'}">${pointText}</p>
        <h2 class="${style.headlineClass}">${style.title}</h2>
        <p class="mission-result-message">${style.message}</p>
        <button onclick="closeMissionComplete()" class="mission-result-button px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-black text-2xl transition-transform">
            확인!
        </button>
    `;

    modal.classList.remove('hidden');

    if (!isPenalty) {
        createConfetti(content);
    }
}

function closeMissionComplete() {
    document.getElementById('mission-complete-modal').classList.add('hidden');
}

// ===== ??＝ ?④낵 =====

function createConfetti(container) {
    const colors = ['#FF6B9D', '#FEC84B', '#12B76A', '#9B6FFF', '#4DA3FF'];

    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

// ===== 주간 활동 렌더링 =====

function renderWeek() {
    const grid = document.getElementById('week-display');
    if (!grid) return;
    grid.innerHTML = '';

    const week = getThisWeekMonSun();
    const today = new Date();
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

    week.forEach((day, idx) => {
        const key = dateKey(day);
        const activities = state.activitiesByDate[key] || [];
        const total = activities.reduce((sum, a) => sum + a.pts, 0);
        const isToday = isSameDay(day, today);
        const scoreText = `(${total > 0 ? '+' : ''}${total || 0})`;

        const dayBox = document.createElement('div');
        // 정렬 요청: 영역 정렬을 위한 패딩 값 유지 (p-4.5)
        dayBox.className = `week-day-card flex-1 card p-4.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${isToday
            ? 'bg-gradient-to-br from-primary to-secondary text-white border-transparent ring-4 ring-primary/20 z-10'
            : 'bg-white border-gray-50 hover:border-primary/20 hover:shadow-xl'
            }`;
        if (isToday) dayBox.classList.add('week-day-today');
        dayBox.onclick = () => openDayDetail(key, day);

        dayBox.innerHTML = `
            <p class="week-day-name text-xl font-black ${isToday ? 'text-white/90' : 'text-gray-500'}">${dayNames[idx]}</p>
            <p class="week-day-date text-4xl font-black ${isToday ? 'text-white' : 'text-gray-800'}">${day.getDate()}</p>
            <p class="week-day-score text-2xl font-black ${total > 0 ? (isToday ? 'text-white/90' : 'text-primary') :
                total < 0 ? (isToday ? 'text-white/90' : 'text-red-400') :
                    (isToday ? 'text-white/70' : 'text-gray-300')
            }">
                ${scoreText}
            </p>
        `;

        grid.appendChild(dayBox);
    });
}

// ===== 일별 상세 팝업 =====

function openDayDetail(key, day) {
    currentDayKey = key;
    const activities = state.activitiesByDate[key] || [];

    if (activities.length === 0) {
        showToast('이 날은 활동이 없어요');
        return;
    }

    document.getElementById('day-detail-title').textContent = `${day.getMonth() + 1}월 ${day.getDate()}일 활동`;

    const list = document.getElementById('day-detail-list');
    list.innerHTML = '';

    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors';

        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-3xl">
                    <i class="ph ${getPhosphorIconClass(activity.icon)}"></i>
                </div>
                <div>
                    <p class="font-bold text-gray-800">${activity.label}</p>
                    <p class="text-sm text-gray-500">${activity.time}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <p class="text-2xl font-black ${activity.pts > 0 ? 'text-green-500' : 'text-red-500'}">
                    ${activity.pts > 0 ? '+' : ''}${activity.pts}P
                </p>
                <button onclick="deleteActivity(${activity.id})" class="px-3 py-2 bg-red-100 text-red-500 rounded-lg font-bold hover:bg-red-200">
                    삭제
                </button>
            </div>
        `;

        list.appendChild(item);
    });

    document.getElementById('day-detail-modal').classList.remove('hidden');
}

function closeDayDetail() {
    document.getElementById('day-detail-modal').classList.add('hidden');
}

function deleteActivity(activityId) {
    if (!currentDayKey) return;

    // 상세 내역 팝업을 먼저 닫아 비밀번호창과 겹치지 않게 함
    closeDayDetail();

    pendingAction = () => {
        const activities = state.activitiesByDate[currentDayKey];
        const activityIdx = activities.findIndex(a => a.id === activityId);

        if (activityIdx > -1) {
            const activity = activities[activityIdx];
            state.score -= activity.pts;

            // 미션 카운트도 함께 차감
            if (state.missionCounts[activity.label] > 0) {
                state.missionCounts[activity.label]--;
            }

            activities.splice(activityIdx, 1);

            saveData();
            updateUI();
            renderWeek();
            showToast('활동을 삭제했어요');
        }
    };

    openPasswordModal();
}

// ===== 배지 테스트 =====






