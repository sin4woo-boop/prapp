function applyMissionCardStyleAOnly() {
    document.body.setAttribute('data-mission-style', 'a');
}

function init() {
    applyMissionCardStyleAOnly();
    loadData();
    updateUI();
    renderMissions();
    renderWeek();
    renderGoals();

    setTimeout(checkGoalFailures, 1000);
}

function updateUI() {
    const totalScore = document.getElementById('total-score');
    const shopScore = document.getElementById('shop-score');
    const profileName = document.getElementById('profile-name');
    const profileEmoji = document.getElementById('profile-emoji');
    const settingsName = document.getElementById('settings-name');
    const emojiInput = document.getElementById('settings-emoji-input');

    if (totalScore) totalScore.textContent = state.score.toLocaleString();
    if (shopScore) shopScore.textContent = state.score.toLocaleString();
    if (profileName) profileName.textContent = state.profile.name;
    if (profileEmoji) profileEmoji.textContent = state.profile.emoji;
    if (settingsName) settingsName.value = state.profile.name;
    if (emojiInput) emojiInput.value = state.profile.emoji;

    renderMainBadge();
}

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
