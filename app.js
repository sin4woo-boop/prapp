// ===== 전역 상태 =====
let state = {
    score: 0,
    profile: { name: "이름을 입력하세요", emoji: "🐻" },
    mainBadgeIds: [],
    missions: [
        { id: 1, icon: "menu_book", label: "책 읽기", pts: 15, color: "bg-blue-100", textColor: "text-blue-600" },
        { id: 2, icon: "piano", label: "피아노 치기", pts: 15, color: "bg-purple-100", textColor: "text-purple-600" },
        { id: 3, icon: "cleaning_services", label: "집 정리하기", pts: 10, color: "bg-green-100", textColor: "text-green-600" },
        { id: 4, icon: "volunteer_activism", label: "양보 하기", pts: 20, color: "bg-pink-100", textColor: "text-pink-600" },
        { id: 5, icon: "school", label: "공부 하기", pts: 15, color: "bg-indigo-100", textColor: "text-indigo-600" },
        { id: 6, icon: "fitness_center", label: "운동 하기", pts: 10, color: "bg-orange-100", textColor: "text-orange-600" },
        { id: 7, icon: "shower", label: "9시 전에 씻기", pts: 15, color: "bg-cyan-100", textColor: "text-cyan-600" },
        { id: 8, icon: "restaurant", label: "밥 잘먹기", pts: 10, color: "bg-yellow-100", textColor: "text-yellow-600" },
        { id: 9, icon: "favorite", label: "부모님께 효도하기", pts: 20, color: "bg-red-100", textColor: "text-red-600" },
        { id: 10, icon: "bedtime", label: "일찍 자기", pts: 15, color: "bg-indigo-100", textColor: "text-indigo-600" },
        { id: 11, icon: "group_off", label: "형제간 싸움", pts: -30, color: "bg-red-100", textColor: "text-red-600" },
        { id: 12, icon: "home_repair_service", label: "정리 안함", pts: -20, color: "bg-red-100", textColor: "text-red-600" },
        { id: 13, icon: "explicit", label: "나쁜말", pts: -40, color: "bg-red-100", textColor: "text-red-600" },
        { id: 14, icon: "cancel", label: "할일 안함", pts: -25, color: "bg-red-100", textColor: "text-red-600" },
        { id: 15, icon: "soap", label: "안 씻기", pts: -20, color: "bg-red-100", textColor: "text-red-600" },
        { id: 16, icon: "bedtime_off", label: "늦게 자기", pts: -25, color: "bg-red-100", textColor: "text-red-600" },
        { id: 17, icon: "volume_off", label: "부모님말 안듣기", pts: -35, color: "bg-red-100", textColor: "text-red-600" },
        { id: 18, icon: "warning", label: "과도한 행동", pts: -30, color: "bg-red-100", textColor: "text-red-600" }
    ],
    goals: [],
    activitiesByDate: {},
    missionCounts: {},
    purchaseHistory: [],
    goalHistory: [],
    earnedBadges: []
};

let password = '0000';
let pendingAction = null;
let currentDayKey = null;

// ===== 초기화 =====
function init() {
    loadData();
    updateUI();
    renderMissions();
    renderWeek();
    renderGoals();

    // 목표 실패 체크 (초기 로딩 시 1회)
    setTimeout(checkGoalFailures, 1000);
}

// ===== 데이터 관리 =====
function saveData() {
    localStorage.setItem('praise_app_data', JSON.stringify(state));
    localStorage.setItem('praise_app_password', password);
}

function loadData() {
    const saved = localStorage.getItem('praise_app_data');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
    }

    const savedPassword = localStorage.getItem('praise_app_password');
    if (savedPassword) {
        password = savedPassword;
    }
}

// 데이터 내보내기 (JSON 파일 다운로드)
function exportData() {
    const backupData = {
        state: state,
        password: password,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const fileName = `praise_app_backup_${dateKey(new Date())}.json`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('데이터가 파일로 저장되었습니다! 💾');
}

// 데이터 불러오기 트리거
function triggerImport() {
    document.getElementById('import-file-input').click();
}

// 데이터 불러오기 실행
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // 데이터 구조 검증
            if (!importedData.state || !importedData.password) {
                throw new Error('올바르지 않은 백업 파일입니다.');
            }

            const confirmed = await showCustomModal({
                title: '데이터 불러오기 ⚠️',
                message: '현재 기기의 모든 데이터가 파일의 내용으로 교체됩니다.\n정말 진행할까요?',
                type: 'confirm',
                icon: '⚠️'
            });

            if (confirmed) {
                state = importedData.state;
                password = importedData.password;

                saveData();
                showToast('데이터를 성공적으로 불러왔습니다! ✨');

                // 앱 재시작 효과를 위해 새로고침 또는 UI 전체 업데이트
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            showToast('파일을 읽는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.');
        } finally {
            // 다음에 동일한 파일을 선택해도 onchange가 발생하도록 초기화
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// ===== UI 업데이트 =====
function updateUI() {
    document.getElementById('total-score').textContent = state.score.toLocaleString();
    document.getElementById('shop-score').textContent = state.score.toLocaleString();
    document.getElementById('profile-name').textContent = state.profile.name;
    document.getElementById('profile-emoji').textContent = state.profile.emoji;

    const emojiInput = document.getElementById('settings-emoji-input');
    if (emojiInput) emojiInput.value = state.profile.emoji;

    document.getElementById('settings-name').value = state.profile.name;

    renderMainBadge();
}

// ===== 미션 렌더링 =====
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

        card.className = `mission-card card p-5 h-full flex flex-col items-center justify-center text-center premium-${selectedTheme}`;
        card.onclick = () => completeMission(mission);

        card.innerHTML = `
            <div class="mb-2">
                <span class="material-symbols-rounded text-5xl">${mission.icon}</span>
            </div>
            <p class="font-black text-[15px] mb-1 uppercase tracking-tight truncate w-full">${mission.label}</p>
            <p class="font-black text-2xl">
                ${mission.pts > 0 ? '+' : ''}${mission.pts}P
            </p>
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

// ===== 미션 완료 팝업 (랜덤 스타일) =====
function showMissionCompleteModal(mission, isPenalty) {
    const modal = document.getElementById('mission-complete-modal');
    const content = document.getElementById('mission-complete-content');

    const styles = isPenalty ? [
        {
            emoji: '😅',
            title: '조심해요!',
            message: `${mission.label}으로 ${mission.pts}P`,
            color: 'text-red-500'
        },
        {
            emoji: '🤔',
            title: '아쉬워요',
            message: `다음엔 잘할 수 있어요\n${mission.pts}P`,
            color: 'text-orange-500'
        }
    ] : [
        {
            emoji: '🎉',
            title: '대단해요!',
            message: `${mission.label}로 +${mission.pts}P 획득!`,
            color: 'text-primary'
        },
        {
            emoji: '⭐',
            title: '멋져요!',
            message: `정말 잘했어요!\n+${mission.pts}P`,
            color: 'text-secondary'
        },
        {
            emoji: '🌟',
            title: '최고예요!',
            message: `계속 이렇게 해봐요!\n+${mission.pts}P`,
            color: 'text-purple'
        },
        {
            emoji: '💪',
            title: '훌륭해요!',
            message: `${mission.label} 성공!\n+${mission.pts}P`,
            color: 'text-skyblue'
        }
    ];

    const style = styles[Math.floor(Math.random() * styles.length)];

    content.innerHTML = `
        <div class="text-8xl mb-6 animate-bounce-slow">${style.emoji}</div>
        <h2 class="text-5xl font-black ${style.color} mb-4">${style.title}</h2>
        <p class="text-2xl font-bold text-gray-700 mb-8 whitespace-pre-line">${style.message}</p>
        <button onclick="closeMissionComplete()" class="px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-black text-2xl hover:scale-105 transition-transform">
            확인! ✨
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

// ===== 폭죽 효과 =====
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

        const dayBox = document.createElement('div');
        // 정밀 요청: 영역 확대에 따른 패딩 및 센터링 강화 (p-4.5)
        dayBox.className = `flex-1 card p-4.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${isToday
            ? 'bg-gradient-to-br from-primary to-secondary text-white border-transparent ring-4 ring-primary/20 scale-105 z-10'
            : 'bg-white border-gray-50 hover:border-primary/20 hover:shadow-xl'
            }`;
        dayBox.onclick = () => openDayDetail(key, day);

        dayBox.innerHTML = `
            <p class="text-2xl font-black mb-1.5 ${isToday ? 'text-white/80' : 'text-gray-400'}">${dayNames[idx]}</p>
            <p class="text-4xl font-black mb-1.5 ${isToday ? 'text-white' : 'text-gray-800'}">${day.getDate()}</p>
            <div class="h-[2px] w-8 mx-auto my-2 ${isToday ? 'bg-white/30' : 'bg-gray-100'}"></div>
            <p class="text-2xl font-black ${total > 0 ? (isToday ? 'text-white' : 'text-primary') :
                total < 0 ? (isToday ? 'text-white' : 'text-red-400') :
                    (isToday ? 'text-white/70' : 'text-gray-200')
            }">
                ${total > 0 ? '+' : ''}${total || 0}
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
                    <span class="material-symbols-rounded">${activity.icon}</span>
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

    // 상세 내역 팝업을 먼저 닫아 암호창과 겹치지 않게 함
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
            showToast('활동이 삭제되었어요');
        }
    };

    openPasswordModal();
}

// ===== 배지 시스템 =====
function getBadgeDefinitions() {
    const levels = [
        { name: '초보', threshold: 10, tier: 'bronze', emoji: '🥉' },
        { name: '중수', threshold: 25, tier: 'silver', emoji: '🥈' },
        { name: '고수', threshold: 50, tier: 'gold', emoji: '🥇' },
        { name: '영웅', threshold: 100, tier: 'diamond', emoji: '💎' }
    ];

    const baseMissions = state.missions.filter(m => m.pts > 0);
    const badges = [];

    baseMissions.forEach((mission, idx) => {
        levels.forEach(level => {
            badges.push({
                id: (idx + 1) * 1000 + level.threshold,
                name: `${mission.label} ${level.name}`,
                missionLabel: mission.label,
                threshold: level.threshold,
                tier: level.tier,
                icon: mission.icon,
                emoji: level.emoji,
                color: mission.color,
                textColor: mission.textColor
            });
        });
    });

    return badges;
}

function checkBadgeUnlock(missionLabel) {
    const count = state.missionCounts[missionLabel] || 0;
    const badges = getBadgeDefinitions();
    const relevantBadges = badges.filter(b => b.missionLabel === missionLabel);

    relevantBadges.forEach(badge => {
        if (count >= badge.threshold && !state.earnedBadges.includes(badge.id)) {
            state.earnedBadges.push(badge.id);
            saveData();
            setTimeout(() => {
                showToast(`🏆 새 배지 획득: ${badge.name}!`);
            }, 1000);
        }
    });
}

function renderMainBadge() {
    const display = document.getElementById('main-badge-display');
    if (!display) return;
    display.innerHTML = '';

    const badges = getBadgeDefinitions();

    // 배지가 하나도 없으면 이미지 2번 스타일의 센터 플레이스홀더
    if (state.mainBadgeIds.length === 0) {
        display.innerHTML = `
            <div class="flex flex-col items-center justify-center py-2">
                <div class="w-24 h-24 rounded-full bg-gray-50 border-4 border-dashed border-gray-100 mb-2 flex items-center justify-center">
                    <span class="material-symbols-rounded text-5xl text-gray-200">workspace_premium</span>
                </div>
                <p class="font-black text-xl text-gray-400">배지를 선택하세요</p>
            </div>
        `;
        return;
    }

    // 정격 요청: 작아진 영역에 맞춰 정렬 최적화
    state.mainBadgeIds.slice(0, 2).forEach(badgeId => {
        const badge = badges.find(b => b.id === badgeId);
        if (badge) {
            const slot = document.createElement('div');
            // 영역 압축 해제 및 공간 최적화
            slot.className = 'flex-1 card p-8 flex flex-col items-center justify-center mx-2';

            // 프리미엄 티어 배지 렌더링
            slot.innerHTML = `
                <div class="tier-badge tier-${badge.tier} scale-125 mb-10">
                    <span class="material-symbols-rounded tier-icon fill-1">${badge.icon}</span>
                </div>
                <p class="text-3xl font-black text-gray-800 text-center px-2 w-full break-keep">${badge.name}</p>
            `;
            display.appendChild(slot);
        }
    });
}
function openBadgeCollection() {
    const grid = document.getElementById('badge-collection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const badges = getBadgeDefinitions();
    const groupedBadges = [];

    const missions = [...new Set(badges.map(b => b.missionLabel))];
    missions.forEach(mission => {
        const missionBadges = badges.filter(b => b.missionLabel === mission);
        groupedBadges.push(missionBadges);
    });

    groupedBadges.forEach(group => {
        const row = document.createElement('div');
        row.className = 'col-span-4 grid grid-cols-4 gap-6 p-6 rounded-2xl bg-gray-50';

        group.forEach(badge => {
            const isEarned = state.earnedBadges.includes(badge.id);
            const isSelected = state.mainBadgeIds.includes(badge.id);
            const currentCount = state.missionCounts[badge.missionLabel] || 0;

            const badgeEl = document.createElement('div');
            badgeEl.className = `badge-item card p-6 text-center cursor-pointer ${!isEarned ? 'locked' : ''} ${isSelected ? 'selected-badge' : ''}`;

            if (isEarned) {
                badgeEl.onclick = () => selectMainBadge(badge.id);
            }

            badgeEl.innerHTML = `
                <div class="tier-badge tier-${badge.tier} mb-4">
                    <span class="material-symbols-rounded tier-icon fill-1">${isEarned ? badge.icon : 'lock'}</span>
                </div>
                <p class="font-black text-gray-800 text-center text-2xl mb-4">${badge.name}</p>
                <div class="w-full p-4 rounded-2xl ${isEarned ? 'bg-primary/10' : 'bg-gray-100'}">
                    <p class="text-sm font-bold ${isEarned ? 'text-primary' : 'text-gray-500'} mb-2">
                        ${isEarned ? '✨ 달성 완료 ✨' : `미션 진행 중 🏃`}
                    </p>
                    <p class="text-xl font-black ${isEarned ? 'text-primary' : 'text-gray-700'}">
                        ${currentCount} / ${badge.threshold}회
                    </p>
                </div>
            `;

            row.appendChild(badgeEl);
        });

        grid.appendChild(row);
    });

    document.getElementById('badge-collection-modal').classList.remove('hidden');
}

function closeBadgeCollection() {
    document.getElementById('badge-collection-modal').classList.add('hidden');
}

function selectMainBadge(id) {
    const index = state.mainBadgeIds.indexOf(id);
    if (index > -1) {
        state.mainBadgeIds.splice(index, 1);
    } else {
        if (state.mainBadgeIds.length >= 2) {
            showToast('대표 배지는 최대 2개까지만 고를 수 있어요');
            return;
        }
        state.mainBadgeIds.push(id);
    }
    saveData();
    renderMainBadge();
    openBadgeCollection();
    showToast(state.mainBadgeIds.includes(id) ? '대표 배지로 설정되었어요! ✨' : '대표 배지 설정이 해제되었어요');
}

// ===== 목표 시스템 =====
function renderGoals() {
    const display = document.getElementById('goal-display');
    if (!display) return;

    if (state.goals.length === 0) {
        display.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center opacity-50">
                <span class="material-symbols-rounded text-6xl mb-4 text-gray-300">target</span>
                <p class="text-gray-400 text-center font-bold text-xl">현재 목표가 없어요</p>
                <p class="text-gray-300 text-sm mt-2">설정에서 목표를 추가해보세요!</p>
            </div>
        `;
        return;
    }

    display.innerHTML = '';

    state.goals.forEach((goal, idx) => {
        const progress = checkGoalCurrentProgress(goal);
        const percentage = (progress.current / goal.targetDays) * 100;

        // 목표마다 다른 테마색 부여하여 구분감 강화
        const themeNames = ['rose', 'amber', 'emerald', 'sky', 'indigo', 'purple'];
        const t = themeNames[idx % themeNames.length];

        // 테마별 클래스 맵 (Tailwind CDN 시인성 확보)
        const themes = {
            rose: { border: 'border-rose-100', text: 'text-rose-500', textMuted: 'text-rose-600', bg: 'bg-rose-50', gradient: 'from-rose-400 to-rose-500' },
            amber: { border: 'border-amber-100', text: 'text-amber-500', textMuted: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-400 to-amber-500' },
            emerald: { border: 'border-emerald-100', text: 'text-emerald-500', textMuted: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-400 to-emerald-500' },
            sky: { border: 'border-sky-100', text: 'text-sky-500', textMuted: 'text-sky-600', bg: 'bg-sky-50', gradient: 'from-sky-400 to-sky-500' },
            indigo: { border: 'border-indigo-100', text: 'text-indigo-500', textMuted: 'text-indigo-600', bg: 'bg-indigo-50', gradient: 'from-indigo-400 to-indigo-500' },
            purple: { border: 'border-purple-100', text: 'text-purple-500', textMuted: 'text-purple-600', bg: 'bg-purple-50', gradient: 'from-purple-400 to-purple-500' }
        };

        const theme = themes[t];

        const goalEl = document.createElement('div');
        goalEl.className = `goal-card card bg-white border-2 ${theme.border} p-6 flex flex-col justify-center gap-5 flex-1 shadow-sm`;

        goalEl.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <h4 class="text-2xl font-black text-gray-800">${goal.missionLabel}</h4>
                    <span class="text-2xl font-black ${theme.text}">(+${goal.rewardPts}P)</span>
                </div>
                <div class="${theme.bg} px-4 py-1.5 rounded-full border ${theme.border}">
                    <span class="text-xl font-black ${theme.textMuted}">${progress.current}/${goal.targetDays}일</span>
                </div>
            </div>
            
            <div class="w-full">
                <div class="h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                    <div class="h-full bg-gradient-to-r ${theme.gradient} transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.1)_inset]"
                         style="width: ${percentage}%"></div>
                </div>
            </div>
        `;

        display.appendChild(goalEl);
    });
}

// 특정 날짜 기준 스트릭 계산 유틸리티
function calculateStreak(goal, baseDate) {
    let streak = 0;
    const startDateKey = goal.startDate || '0000-00-00'; // 시작일이 없으면 아주 옛날부터

    for (let i = 0; i < goal.targetDays; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        const key = dateKey(date);

        // 목표 시작일 이전의 데이터는 계산하지 않음
        if (key < startDateKey) break;

        const activities = state.activitiesByDate[key] || [];
        const hasMission = activities.some(a => a.label === goal.missionLabel && a.pts > 0);

        if (hasMission) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

function checkGoalCurrentProgress(goal) {
    // 오늘 기록이 있으면 오늘 포함 스트릭, 없으면 어제 포함 스트릭 표시 (더 사용자 친화적)
    const todayStreak = calculateStreak(goal, new Date());

    if (todayStreak > 0) {
        return { current: todayStreak, total: goal.targetDays };
    } else {
        // 오늘 기록이 없으면 어제 기준 스트릭 확인
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStreak = calculateStreak(goal, yesterday);
        return { current: yesterdayStreak, total: goal.targetDays };
    }
}

// 목표 실패 체크 및 팝업
function checkGoalFailures() {
    const todayKey = dateKey(new Date());
    let hasNewFailure = false;

    state.goals.forEach(goal => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // 어제 기준 스트릭이 있었는데, 어제 미션을 안 했다면 실패!
        // (calculateStreak(goal, yesterday)가 0이면 이미 이전에 깨진 것)
        // 여기서는 "어제 미션을 안 해서 스트릭이 깨진 순간"을 포착합니다.

        const yesterdayKey = dateKey(yesterday);
        const yesterdayActivities = state.activitiesByDate[yesterdayKey] || [];
        const didYesterday = yesterdayActivities.some(a => a.label === goal.missionLabel && a.pts > 0);

        // 어제는 안 했지만, 그저께까지는 스트릭이 유지되고 있었다면 (즉, 어제가 범인일 때)
        const dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        const streakUntilDByest = calculateStreak(goal, dayBeforeYesterday);

        if (!didYesterday && streakUntilDByest > 0) {
            // 이번 실패에 대해 오늘 이미 팝업을 보여줬는지 확인
            if (goal.lastFailureAlertDate !== todayKey) {
                goal.lastFailureAlertDate = todayKey;
                hasNewFailure = true;

                showCustomModal({
                    title: '목표 실패 😢',
                    message: `[${goal.missionLabel}] 미션을 실패했어요.\n어제 꾸준히 하지 못해 스트릭이 깨졌습니다.\n오늘부터 다시 1일차로 도전해봐요!`,
                    confirmText: '다시 도전하기! 🔥',
                    icon: '💔'
                });
            }
        }
    });

    if (hasNewFailure) {
        saveData();
        renderGoals();
    }
}

function checkGoalProgress(missionLabel) {
    state.goals.forEach(goal => {
        if (goal.missionLabel === missionLabel) {
            const progress = checkGoalCurrentProgress(goal);

            if (progress.current >= goal.targetDays) {
                state.score += goal.rewardPts;
                state.goalHistory.push({
                    goal: goal.missionLabel,
                    days: goal.targetDays,
                    reward: goal.rewardPts,
                    date: new Date().toISOString()
                });

                state.goals = state.goals.filter(g => g.id !== goal.id);

                saveData();
                updateUI();
                renderGoals();

                setTimeout(() => {
                    showGoalComplete(goal);
                }, 1500);
            } else {
                renderGoals();
            }
        }
    });
}

function showGoalComplete(goal) {
    document.getElementById('goal-complete-title').textContent = '목표 달성! 🎉';
    document.getElementById('goal-complete-message').textContent = `${goal.missionLabel}을 ${goal.targetDays}일 연속 달성!\n+${goal.rewardPts}P 획득!`;

    const modal = document.getElementById('goal-complete-modal');
    const container = document.getElementById('confetti-container');
    modal.classList.remove('hidden');
    createConfetti(container);
}

function closeGoalComplete() {
    document.getElementById('goal-complete-modal').classList.add('hidden');
}

// ===== 선물샵 =====
function openGiftShop() {
    document.getElementById('custom-gift-name').value = '';
    document.getElementById('custom-gift-cost').value = '';
    document.getElementById('gift-shop-modal').classList.remove('hidden');
}

function closeGiftShop() {
    document.getElementById('gift-shop-modal').classList.add('hidden');
}

// ===== 커스텀 모달 (Alert/Confirm/Prompt 통합) =====
function showCustomModal(options) {
    const {
        title = '알림',
        message = '',
        icon = '🔔',
        type = 'alert', // alert, confirm, prompt, select
        placeholder = '내용을 입력하세요',
        inputType = 'text',
        selectOptions = [] // [{value: '', label: ''}, ...]
    } = options;

    return new Promise((resolve) => {
        const modal = document.getElementById('universal-modal');
        const titleEl = document.getElementById('u-modal-title');
        const messageEl = document.getElementById('u-modal-message');
        const iconEl = document.getElementById('u-modal-icon');
        const inputContainer = document.getElementById('u-modal-input-container');
        const input = document.getElementById('u-modal-input');
        const selectContainer = document.getElementById('u-modal-select-container');
        const select = document.getElementById('u-modal-select');
        const btnCancel = document.getElementById('u-modal-cancel');
        const btnConfirm = document.getElementById('u-modal-confirm');

        titleEl.textContent = title;
        messageEl.textContent = message;
        iconEl.textContent = icon;

        // 초기화
        inputContainer.classList.add('hidden');
        selectContainer.classList.add('hidden');

        // 타입별 UI 조정
        if (type === 'prompt') {
            inputContainer.classList.remove('hidden');
            input.value = '';
            input.type = inputType;
            input.placeholder = placeholder;
            setTimeout(() => input.focus(), 100);
        } else if (type === 'select') {
            selectContainer.classList.remove('hidden');
            select.innerHTML = '';
            selectOptions.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                select.appendChild(o);
            });
            setTimeout(() => select.focus(), 100);
        }

        if (type === 'alert') {
            btnCancel.classList.add('hidden');
        } else {
            btnCancel.classList.remove('hidden');
        }

        modal.classList.remove('hidden');

        const cleanup = (value) => {
            modal.classList.add('hidden');
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            input.onkeypress = null;
            select.onkeypress = null;
            resolve(value);
        };

        btnConfirm.onclick = () => {
            let val;
            if (type === 'prompt') val = input.value;
            else if (type === 'select') val = select.value;
            else val = true;
            cleanup(val);
        };

        btnCancel.onclick = () => cleanup(null);

        input.onkeypress = (e) => {
            if (e.key === 'Enter') btnConfirm.click();
        };
        select.onkeypress = (e) => {
            if (e.key === 'Enter') btnConfirm.click();
        };
    });
}

async function purchaseCustomGift() {
    const name = document.getElementById('custom-gift-name').value.trim();
    const cost = parseInt(document.getElementById('custom-gift-cost').value);

    if (!name) {
        showToast('어떤 선물인지 적어주세요!');
        return;
    }

    if (isNaN(cost) || cost <= 0) {
        showToast('올바른 점수를 입력해주세요');
        return;
    }

    if (state.score < cost) {
        showToast('점수가 부족합니다! 😅');
        return;
    }

    const confirmed = await showCustomModal({
        title: '선물 교환 🎁',
        message: `${name}를\n${cost}P에 구매할까요?`,
        type: 'confirm'
    });

    if (confirmed) {
        state.score -= cost;
        state.purchaseHistory.push({
            name: name,
            cost: cost,
            date: new Date().toISOString()
        });

        saveData();
        updateUI();
        closeGiftShop();
        showToast(`${name} 구매 완료! 🎁`);
    }
}

// ===== 대시보드 =====
function openDashboard() {
    renderDashboard();
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
}

function closeDashboard() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
}

function renderDashboard() {
    renderMonthlyChart();
    renderBestDay();
    renderCumulativePoints();
    renderTopMissions();
    renderGiftHistory();
    renderGoalHistory();
}

function renderCumulativePoints() {
    const el = document.getElementById('cumulative-score');
    if (!el) return;

    let totalEarned = 0;
    Object.values(state.activitiesByDate).forEach(dayActivities => {
        totalEarned += dayActivities
            .filter(a => a.pts > 0)
            .reduce((sum, a) => sum + a.pts, 0);
    });

    // 목표 보상도 누적 포인트에 포함
    state.goalHistory.forEach(item => {
        totalEarned += item.reward;
    });

    el.textContent = totalEarned.toLocaleString() + 'P';
}

function renderMonthlyChart() {
    const chart = document.getElementById('monthly-chart');
    if (!chart) return;
    chart.innerHTML = '';

    const monthlyScores = {};
    Object.keys(state.activitiesByDate).forEach(key => {
        const month = key.substring(0, 7);
        const dayScore = state.activitiesByDate[key]
            .filter(a => a.pts > 0)
            .reduce((sum, a) => sum + a.pts, 0);
        monthlyScores[month] = (monthlyScores[month] || 0) + dayScore;
    });

    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push({
            key: key,
            label: `${d.getMonth() + 1}월`,
            score: monthlyScores[key] || 0,
            isCurrent: i === 0
        });
    }

    const maxScore = Math.max(...months.map(m => m.score), 1);

    months.forEach(month => {
        const height = (month.score / maxScore) * 100;
        const barWrapper = document.createElement('div');
        barWrapper.className = 'flex-1 flex flex-col items-center h-full justify-end';

        // 영역이 좁아졌으므로 크기 최적화
        const displayHeight = Math.max(height * 0.7, 2);

        barWrapper.innerHTML = `
            <div class="relative w-full flex flex-col items-center justify-end h-[75%]">
                <!-- 점수 표시 -->
                <div class="mb-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-black shadow-sm z-20 border border-indigo-100">
                    ${month.score}
                </div>
                
                <!-- 바 -->
                <div class="w-8 sm:w-12 rounded-t-xl rounded-b-md transition-all duration-1000 relative overflow-hidden flex flex-col justify-end shadow-md ${month.isCurrent ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' : 'bg-gradient-to-t from-gray-200 to-gray-100'}" 
                     style="height: ${displayHeight}%">
                    <div class="absolute top-0 inset-x-0 h-1/3 bg-white/10"></div>
                </div>
            </div>
            
            <p class="mt-3 text-sm font-black ${month.isCurrent ? 'text-indigo-600' : 'text-gray-400'} tracking-tight">${month.label}</p>
        `;
        chart.appendChild(barWrapper);
    });
}

function renderBestDay() {
    let bestScore = 0;
    let bestDate = null;

    Object.keys(state.activitiesByDate).forEach(key => {
        // 일관성을 위해 획득(Earned) 점수 기준으로 계산
        const dayScore = state.activitiesByDate[key]
            .filter(a => a.pts > 0)
            .reduce((sum, a) => sum + a.pts, 0);

        if (dayScore > bestScore) {
            bestScore = dayScore;
            bestDate = key;
        }
    });

    const scoreEl = document.getElementById('best-day-score');
    const dateEl = document.getElementById('best-day-date');
    if (scoreEl) scoreEl.textContent = (bestScore || 0) + 'P';

    if (dateEl && bestDate) {
        const d = new Date(bestDate);
        dateEl.textContent = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    } else if (dateEl) {
        dateEl.textContent = '-';
    }
}

function renderTopMissions() {
    const goodContainer = document.getElementById('top-missions-good');
    const badContainer = document.getElementById('top-missions-bad');
    if (!goodContainer || !badContainer) return;

    goodContainer.innerHTML = '';
    badContainer.innerHTML = '';

    const counts = Object.entries(state.missionCounts);

    // 미션 데이터 가져오기 (점수 확인용)
    const allMissions = state.missions;
    const getPts = (label) => allMissions.find(m => m.label === label)?.pts || 0;

    const goodMissions = counts
        .filter(([label]) => getPts(label) > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const badMissions = counts
        .filter(([label]) => getPts(label) < 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const renderItems = (list, container, colorClass, barColor, hoverColor) => {
        if (list.length === 0) {
            container.innerHTML = '<div class="flex-1 flex items-center justify-center"><p class="text-2xl font-black text-gray-200 text-center">아직 기록이 없어요</p></div>';
            return;
        }

        // Vertical ranking list
        const grid = document.createElement('div');
        grid.className = 'flex flex-col gap-3 h-full pb-2';

        list.forEach(([label, count], idx) => {
            const missionData = allMissions.find(m => m.label === label);
            const icon = missionData ? missionData.icon : 'star';

            const rankColors = [
                'bg-amber-100 text-amber-600', // 1st
                'bg-slate-100 text-slate-500', // 2nd
                'bg-orange-100 text-orange-600' // 3rd
            ];

            const item = document.createElement('div');
            item.className = 'flex-1 flex flex-col justify-center gap-4 p-6 rounded-[32px] bg-white/60 border-2 border-white/40 shadow-sm hover:translate-x-1 transition-all min-h-0 overflow-hidden';
            item.innerHTML = `
                <!-- 1st Line: Rank, Icon, Count -->
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-full ${rankColors[idx] || 'bg-gray-100'} flex items-center justify-center shrink-0 font-black text-xl">
                            ${idx + 1}
                        </div>
                        <div class="w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center shrink-0">
                            <span class="material-symbols-rounded text-2xl">${icon}</span>
                        </div>
                    </div>
                    <span class="text-xl font-black text-gray-400 shrink-0">${count}회</span>
                </div>
                
                <!-- 2nd Line: Title -->
                <div class="min-w-0">
                    <p class="font-black text-gray-800 truncate text-2xl tracking-tight">${label}</p>
                </div>
            `;
            grid.appendChild(item);
        });
        container.appendChild(grid);
    };

    renderItems(goodMissions, goodContainer, 'bg-emerald-100 text-emerald-600', 'bg-emerald-400');
    renderItems(badMissions, badContainer, 'bg-rose-100 text-rose-600', 'bg-rose-400');
}

function renderGiftHistory() {
    const list = document.getElementById('gift-history-preview');
    if (!list) return;
    list.innerHTML = '';

    const history = [...state.purchaseHistory].reverse();
    if (history.length === 0) {
        list.innerHTML = `<div class="flex-1 flex items-center justify-center"><p class="font-black text-2xl text-gray-200">구매 내역 없음</p></div>`;
        return;
    }

    history.forEach(item => {
        const h = document.createElement('div');
        h.className = 'flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-50 shadow-sm hover:scale-[1.02] transition-all';
        const d = new Date(item.date);
        const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;

        h.innerHTML = `
            <div class="text-3xl shrink-0">🎁</div>
            <div class="flex-1 flex items-center justify-between min-w-0 gap-4">
                <p class="text-xl font-black text-gray-800 truncate">${item.name}</p>
                <div class="flex items-center gap-3 shrink-0">
                    <p class="text-sm font-bold text-gray-400">${dateStr}</p>
                    <p class="text-xl font-black text-blue-600">-${item.cost.toLocaleString()}P</p>
                </div>
            </div>
        `;
        list.appendChild(h);
    });
}

function renderGoalHistory() {
    const list = document.getElementById('goal-history-preview');
    if (!list) return;
    list.innerHTML = '';

    const history = [...state.goalHistory].reverse();
    if (history.length === 0) {
        list.innerHTML = `<div class="flex-1 flex items-center justify-center"><p class="font-black text-2xl text-gray-200">달성 기록 없음</p></div>`;
        return;
    }

    history.forEach(item => {
        const h = document.createElement('div');
        h.className = 'flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-50 shadow-sm hover:scale-[1.02] transition-all';
        const d = new Date(item.date);
        const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;

        h.innerHTML = `
            <div class="text-3xl shrink-0">✨</div>
            <div class="flex-1 flex items-center justify-between min-w-0 gap-4">
                <p class="text-xl font-black text-gray-800 truncate">${item.goal}</p>
                <div class="flex items-center gap-3 shrink-0">
                    <p class="text-sm font-bold text-gray-400">${dateStr}</p>
                    <p class="text-xl font-black text-purple-600">+${item.reward.toLocaleString()}P</p>
                </div>
            </div>
        `;
        list.appendChild(h);
    });
}


function openFullHistory(type) {
    const modal = document.getElementById('history-full-modal');
    const title = document.getElementById('history-full-title');
    const list = document.getElementById('history-full-list');

    if (!modal || !title || !list) return;

    list.innerHTML = '';
    const items = type === 'gift' ? [...state.purchaseHistory].reverse() : [...state.goalHistory].reverse();
    const typeLabel = type === 'gift' ? '선물 구매 내역' : '목표 달성 기록';

    title.textContent = `${typeLabel} (총 ${items.length}개)`;

    if (items.length === 0) {
        list.innerHTML = `<div class="h-64 flex flex-col items-center justify-center opacity-30">
            <span class="material-symbols-rounded text-9xl mb-4">history_toggle_off</span>
            <p class="text-3xl font-black">내역이 아직 없어요</p>
        </div>`;
    } else {
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'flex items-center gap-6 p-6 rounded-[32px] bg-gray-50 border-2 border-gray-100 shadow-sm';
            const d = new Date(item.date);
            const dateStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

            if (type === 'gift') {
                el.innerHTML = `
                    <div class="text-5xl shrink-0">🎁</div>
                    <div class="flex-1 flex items-center justify-between min-w-0 gap-6">
                        <p class="text-2xl font-black text-gray-900 truncate">${item.name}</p>
                        <div class="flex items-center gap-4 shrink-0">
                            <p class="text-lg font-bold text-gray-500">${dateStr}</p>
                            <p class="text-3xl font-black text-blue-600">-${item.cost.toLocaleString()}P</p>
                        </div>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <div class="text-5xl shrink-0">✨</div>
                    <div class="flex-1 flex items-center justify-between min-w-0 gap-6">
                        <p class="text-2xl font-black text-gray-900 truncate">${item.goal}</p>
                        <div class="flex items-center gap-4 shrink-0">
                            <p class="text-lg font-bold text-gray-500">${dateStr}</p>
                            <p class="text-3xl font-black text-purple-600">+${item.reward.toLocaleString()}P</p>
                        </div>
                    </div>
                `;
            }
            list.appendChild(el);
        });
    }

    modal.classList.remove('hidden');
}

function closeFullHistory() {
    document.getElementById('history-full-modal').classList.add('hidden');
}

// ===== 설정 =====
function openSettings() {
    pendingAction = () => {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('settings-screen').classList.remove('hidden');
        renderSettingsMissions();
        renderSettingsGoals();
    };
    openPasswordModal();
}

function closeSettings() {
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
}

function showSettingsTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`settings-tab-${tabName}`).classList.remove('hidden');
}

function changeEmoji() {
    const emojis = ['🐻', '🐶', '🐱', '🐰', '🦊', '🦁', '🐯', '🐼', '🐨', '🐸'];
    const current = state.profile.emoji;
    const idx = emojis.indexOf(current);
    const next = emojis[(idx + 1) % emojis.length];

    state.profile.emoji = next;
    saveData();
    updateUI();
}

function renderSettingsMissions() {
    const grid = document.getElementById('mission-settings-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.missions.forEach(mission => {
        const card = document.createElement('div');
        card.className = 'card p-3 flex flex-col gap-2 bg-gray-50/50';

        const isPositive = mission.pts >= 0;
        const ptsColor = isPositive ? 'text-blue-600' : 'text-red-600';

        card.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="material-symbols-rounded text-2xl text-gray-400">${mission.icon}</span>
                <input type="text" data-id="${mission.id}" data-type="label" value="${mission.label}" 
                    class="flex-1 min-w-0 px-2 py-1 rounded-lg border-2 border-transparent font-bold focus:outline-none focus:border-primary bg-white/50">
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-gray-400 w-8">점수</span>
                <input type="number" data-id="${mission.id}" data-type="pts" value="${mission.pts}" 
                    class="w-full px-2 py-1 rounded-lg border-2 border-transparent font-black ${ptsColor} text-center focus:outline-none focus:border-primary bg-white/50">
            </div>
        `;
        grid.appendChild(card);
    });
}

function saveAllMissions() {
    const inputs = document.querySelectorAll('#mission-settings-grid input');
    const updates = {};

    inputs.forEach(input => {
        const id = input.dataset.id;
        const type = input.dataset.type;
        if (!updates[id]) updates[id] = {};
        updates[id][type] = type === 'pts' ? parseInt(input.value) : input.value;
    });

    // 라벨 변경 시 히스토리 데이터 마이그레이션
    state.missions.forEach(mission => {
        const update = updates[mission.id];
        if (update && update.label !== mission.label) {
            const oldLabel = mission.label;
            const newLabel = update.label;

            // missionCounts 업데이트
            if (state.missionCounts[oldLabel] !== undefined) {
                state.missionCounts[newLabel] = (state.missionCounts[newLabel] || 0) + state.missionCounts[oldLabel];
                delete state.missionCounts[oldLabel];
            }

            // activitiesByDate 업데이트
            Object.values(state.activitiesByDate).forEach(dayActivities => {
                dayActivities.forEach(activity => {
                    if (activity.label === oldLabel) activity.label = newLabel;
                });
            });

            // goals 업데이트
            state.goals.forEach(goal => {
                if (goal.missionLabel === oldLabel) goal.missionLabel = newLabel;
            });

            // goalHistory 업데이트
            state.goalHistory.forEach(item => {
                if (item.goal === oldLabel) item.goal = newLabel;
            });
        }
    });

    state.missions = state.missions.map(mission => {
        const update = updates[mission.id];
        if (update) {
            return { ...mission, label: update.label, pts: update.pts };
        }
        return mission;
    });

    saveData();
    renderMissions();
    renderGoals(); // 목표 UI도 함께 업데이트
    showToast('모든 설정이 저장되었습니다! ✨');
}

function renderSettingsGoals() {
    const list = document.getElementById('goals-list');
    if (!list) return;
    list.innerHTML = '';

    state.goals.forEach(goal => {
        const card = document.createElement('div');
        card.className = 'card p-6';
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <p class="font-bold text-gray-800 mb-2">${goal.missionLabel}</p>
                    <p class="text-sm text-gray-600">${goal.targetDays}일 연속 | +${goal.rewardPts}P</p>
                </div>
                <button onclick="deleteGoal(${goal.id})" class="px-4 py-2 bg-red-100 text-red-500 rounded-xl font-bold hover:bg-red-200">
                    삭제
                </button>
            </div>
        `;
        list.appendChild(card);
    });

    if (state.goals.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-center py-8">목표가 없어요</p>';
    }
}

async function addNewGoal() {
    if (state.goals.length >= 3) {
        showToast('목표는 최대 3개까지만 설정할 수 있어요');
        return;
    }

    const missionOptions = state.missions
        .filter(m => m.pts > 0)
        .map(m => ({ value: m.label, label: `${m.label} (+${m.pts}P)` }));

    const mission = await showCustomModal({
        title: '새 목표 설정 🎯',
        message: '어떤 미션을 목표로 할까요?',
        type: 'select',
        selectOptions: missionOptions
    });
    if (!mission) return;

    const daysStr = await showCustomModal({
        title: '연속 달성 기간 📅',
        message: '며칠 연속으로 할까요?',
        type: 'prompt',
        placeholder: '1~7 사이 숫자',
        inputType: 'number'
    });
    const days = parseInt(daysStr);
    if (!days || days < 1 || days > 7) {
        showToast('1~7일 사이로 입력해주세요');
        return;
    }

    const rewardStr = await showCustomModal({
        title: '보상 점수 💎',
        message: '달성 시 받을 보상 점수?',
        type: 'prompt',
        placeholder: '점수 입력',
        inputType: 'number'
    });
    const reward = parseInt(rewardStr);
    if (!reward || reward <= 0) {
        showToast('올바른 점수를 입력해주세요');
        return;
    }

    const startChoice = await showCustomModal({
        title: '시작 시점 선택 🚀',
        message: '언제부터 목표를 시작할까요?',
        type: 'select',
        selectOptions: [
            { value: 'today', label: '오늘부터 바로 시작!' },
            { value: 'tomorrow', label: '내일부터 새롭게 시작!' }
        ]
    });
    if (!startChoice) return;

    let startDate = new Date();
    if (startChoice === 'tomorrow') {
        startDate.setDate(startDate.getDate() + 1);
    }

    state.goals.push({
        id: Date.now(),
        missionLabel: mission,
        targetDays: days,
        rewardPts: reward,
        startDate: dateKey(startDate)
    });

    saveData();
    renderGoals();
    renderSettingsGoals();
    showToast('목표가 추가되었어요!');
}

function deleteGoal(id) {
    state.goals = state.goals.filter(g => g.id !== id);
    saveData();
    renderGoals();
    renderSettingsGoals();
    showToast('목표가 삭제되었어요');
}

function changePassword() {
    const current = document.getElementById('current-password').value;
    const newPwd = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (current !== password) {
        showToast('현재 비밀번호가 틀렸어요');
        return;
    }

    if (newPwd.length !== 4 || isNaN(newPwd)) {
        showToast('비밀번호는 4자리 숫자여야 해요');
        return;
    }

    if (newPwd !== confirm) {
        showToast('새 비밀번호가 일치하지 않아요');
        return;
    }

    password = newPwd;
    saveData();

    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    showToast('비밀번호가 변경되었어요!');
}

async function resetAllData() {
    const firstConfirm = await showCustomModal({
        title: '⚠️ 데이터 초기화',
        message: '정말 모든 데이터를 초기화할까요?\n\n이 작업은 되돌릴 수 없어요!',
        type: 'confirm',
        icon: '⚠️'
    });

    if (!firstConfirm) return;

    const secondConfirm = await showCustomModal({
        title: '마지막 확인 🔴',
        message: '한 번 더 확인합니다.\n모든 점수와 활동, 비밀번호가 삭제돼요!',
        type: 'confirm',
        icon: '🚫'
    });

    if (secondConfirm) {
        localStorage.clear();
        location.reload();
    }
}

// ===== 비밀번호 모달 =====
function openPasswordModal() {
    document.getElementById('password-modal').classList.remove('hidden');
    document.getElementById('password-input').focus();
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('password-input').value = '';
}

function checkPassword() {
    const input = document.getElementById('password-input').value;
    if (input === password) {
        closePasswordModal();
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        }
    } else {
        showToast('비밀번호가 틀렸어요');
        document.getElementById('password-input').value = '';
    }
}

// ===== 토스트 =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ===== 유틸리티 =====
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
document.addEventListener('DOMContentLoaded', () => {
    init();

    const pwdInput = document.getElementById('password-input');
    if (pwdInput) {
        pwdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }

    const emojiInput = document.getElementById('settings-emoji-input');
    if (emojiInput) {
        emojiInput.addEventListener('input', function () {
            state.profile.emoji = this.value;
            saveData();
            updateUI();
        });
    }

    const nameInput = document.getElementById('settings-name');
    if (nameInput) {
        nameInput.addEventListener('input', function () {
            state.profile.name = this.value;
            saveData();
            updateUI();
        });
    }
});
