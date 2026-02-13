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

        const themeNames = ['rose', 'amber', 'emerald', 'sky', 'indigo', 'purple'];
        const t = themeNames[idx % themeNames.length];

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

function calculateStreak(goal, baseDate) {
    let streak = 0;
    const startDateKey = goal.startDate || '0000-00-00';

    for (let i = 0; i < goal.targetDays; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        const key = dateKey(date);

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
    const todayStreak = calculateStreak(goal, new Date());

    if (todayStreak > 0) {
        return { current: todayStreak, total: goal.targetDays };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStreak = calculateStreak(goal, yesterday);
    return { current: yesterdayStreak, total: goal.targetDays };
}

function checkGoalFailures() {
    const todayKey = dateKey(new Date());
    let hasNewFailure = false;

    state.goals.forEach(goal => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayKey = dateKey(yesterday);
        const yesterdayActivities = state.activitiesByDate[yesterdayKey] || [];
        const didYesterday = yesterdayActivities.some(a => a.label === goal.missionLabel && a.pts > 0);

        const dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        const streakUntilDByest = calculateStreak(goal, dayBeforeYesterday);

        if (!didYesterday && streakUntilDByest > 0) {
            if (goal.lastFailureAlertDate !== todayKey) {
                goal.lastFailureAlertDate = todayKey;
                hasNewFailure = true;

                showCustomModal({
                    title: '목표 실패 알림',
                    message: `[${goal.missionLabel}] 미션에 실패했어요.\n어제 수행하지 못해 연속 기록이 끊겼습니다.\n오늘부터 다시 1일차로 도전해요!`,
                    confirmText: '다시 도전하기! 💪',
                    icon: '🔔'
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
    document.getElementById('goal-complete-message').textContent = `${goal.missionLabel} ${goal.targetDays}일 연속 달성!\n+${goal.rewardPts}P 획득!`;

    const modal = document.getElementById('goal-complete-modal');
    const container = document.getElementById('confetti-container');
    modal.classList.remove('hidden');
    createConfetti(container);
}

function closeGoalComplete() {
    document.getElementById('goal-complete-modal').classList.add('hidden');
}

// ===== 목표 =====
