function getBadgeDefinitions() {
    const levels = [
        { name: '초보', threshold: 10, tier: 'bronze', emoji: '??' },
        { name: '중수', threshold: 25, tier: 'silver', emoji: '??' },
        { name: '고수', threshold: 50, tier: 'gold', emoji: '??' },
        { name: '전설', threshold: 100, tier: 'diamond', emoji: '??' }
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

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatBadgeName(name) {
    const raw = String(name || '');
    const match = raw.match(/^(.*)\s(초보|중수|고수|영웅|전설)$/);
    if (!match) return escapeHtml(raw);

    const base = escapeHtml(match[1]);
    const rank = match[2];
    const rankClassMap = {
        '초보': 'beginner',
        '중수': 'intermediate',
        '고수': 'expert',
        '영웅': 'hero',
        '전설': 'hero'
    };
    const rankClass = rankClassMap[rank] || 'hero';
    return `${base} <span class="badge-rank badge-rank--${rankClass}">${escapeHtml(rank)}</span>`;
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
                showToast(`?? 새 배지 획득: ${badge.name}!`);
            }, 1000);
        }
    });
}

function renderMainBadge() {
    const display = document.getElementById('main-badge-display');
    if (!display) return;
    display.innerHTML = '';

    const badges = getBadgeDefinitions();

    if (state.mainBadgeIds.length === 0) {
        display.innerHTML = `
            <div class="flex flex-col items-center justify-center py-2">
                <div class="w-24 h-24 rounded-full bg-gray-50 border-4 border-dashed border-gray-100 mb-2 flex items-center justify-center">
                <i class="ph ph-seal-question text-5xl text-gray-200"></i>
                </div>
                <p class="font-black text-xl text-gray-400">배지를 선택하세요</p>
            </div>
        `;
        return;
    }

    state.mainBadgeIds.slice(0, 2).forEach(badgeId => {
        const badge = badges.find(b => b.id === badgeId);
        if (!badge) return;

        const slot = document.createElement('div');
        slot.className = 'flex-1 card p-8 flex flex-col items-center justify-center mx-2';

        slot.innerHTML = `
            <div class="tier-badge tier-${badge.tier} scale-125 mb-10">
                <i class="ph ${getPhosphorIconClass(badge.icon)} tier-icon"></i>
            </div>
            <p class="text-3xl font-black text-gray-800 text-center px-2 w-full break-keep">${formatBadgeName(badge.name)}</p>
        `;
        display.appendChild(slot);
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
        groupedBadges.push(badges.filter(b => b.missionLabel === mission));
    });

    groupedBadges.forEach(group => {
        const row = document.createElement('div');
        row.className = 'col-span-4 grid grid-cols-4 gap-6 p-6 rounded-2xl bg-gray-50';

        group.forEach(badge => {
            const isEarned = state.earnedBadges.includes(badge.id);
            const isSelected = state.mainBadgeIds.includes(badge.id);
            const isPinned = isSelected;
            const currentCount = state.missionCounts[badge.missionLabel] || 0;
            const progress = Math.min(100, Math.round((currentCount / badge.threshold) * 100));

            const badgeEl = document.createElement('div');
            badgeEl.className = `badge-item card p-6 text-center cursor-pointer ${!isEarned ? 'locked' : ''} ${isPinned ? 'is-pinned' : ''} tier-${badge.tier}`;

            if (isEarned) {
                badgeEl.onclick = () => selectMainBadge(badge.id);
            }

            badgeEl.innerHTML = `
                ${isPinned ? '<span class="badge-pinned-pill">대표</span>' : ''}
                <div class="tier-badge tier-${badge.tier} mb-4">
                    <i class="ph ${isEarned ? getPhosphorIconClass(badge.icon) : 'ph-lock'} tier-icon"></i>
                </div>
                <p class="font-black text-gray-800 text-center text-2xl mb-4 badge-name">${formatBadgeName(badge.name)}</p>
                <div class="badge-status">
                    <p class="badge-status-label ${isEarned ? 'text-primary' : 'text-gray-500'}">
                        ${isEarned ? '? 달성 완료' : '미션 진행 중'}
                    </p>
                    <p class="badge-status-value ${isEarned ? 'text-primary' : 'text-gray-700'}">
                        ${currentCount} / ${badge.threshold}회
                    </p>
                    ${!isEarned ? `<div class="badge-progress"><div class="badge-progress-fill" style="--badge-progress:${progress}%"></div></div>` : ''}
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
    showToast(state.mainBadgeIds.includes(id) ? '대표 배지로 설정했어요! ?' : '대표 배지 설정을 해제했어요');
}

// ===== 목표 테스트 =====

