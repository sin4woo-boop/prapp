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
    const emojis = ['🐻', '🐯', '🐰', '🐱', '🐶', '🦊', '🐼', '🐵', '🐨', '🦁'];
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
    renderGoals(); // 목표 UI도 즉시 업데이트
    showToast('모든 설정이 저장되었습니다! ✅');
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
        showToast('1~7 사이로 입력해 주세요');
        return;
    }

    const rewardStr = await showCustomModal({
        title: '보상 점수 💰',
        message: '달성 시 받을 보상 점수는?',
        type: 'prompt',
        placeholder: '점수 입력',
        inputType: 'number'
    });
    const reward = parseInt(rewardStr);
    if (!reward || reward <= 0) {
        showToast('올바른 점수를 입력해 주세요');
        return;
    }

    const startChoice = await showCustomModal({
        title: '시작 시점 선택 ⏰',
        message: '언제부터 목표를 시작할까요?',
        type: 'select',
        selectOptions: [
            { value: 'today', label: '오늘부터 바로 시작!' },
            { value: 'tomorrow', label: '내일부터 여유있게 시작!' }
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
    showToast('비밀번호가 변경되었어요');
}

async function resetAllData() {
    const firstConfirm = await showCustomModal({
        title: '전체 데이터 초기화',
        message: '정말 모든 데이터를 초기화할까요?\n\n이 작업은 되돌릴 수 없어요',
        type: 'confirm',
        icon: '⚠️'
    });

    if (!firstConfirm) return;

    const secondConfirm = await showCustomModal({
        title: '마지막 확인 🚨',
        message: '한 번 더 확인합니다!\n모든 점수와 활동, 비밀번호가 삭제돼요!',
        type: 'confirm',
        icon: '🗑️'
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

