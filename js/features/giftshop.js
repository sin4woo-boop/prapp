function openGiftShop() {
    document.getElementById('custom-gift-name').value = '';
    document.getElementById('custom-gift-cost').value = '';
    document.getElementById('gift-shop-modal').classList.remove('hidden');
}

function closeGiftShop() {
    document.getElementById('gift-shop-modal').classList.add('hidden');
}

// ===== 커스텀 모달 (Alert/Confirm/Prompt 통합) =====
let isCustomModalOpen = false;

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

    if (isCustomModalOpen) return Promise.resolve(null);
    isCustomModalOpen = true;

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
            setTimeout(() => input.focus(), 150);
        } else if (type === 'select') {
            selectContainer.classList.remove('hidden');
            select.innerHTML = '';
            selectOptions.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                select.appendChild(o);
            });
            setTimeout(() => select.focus(), 150);
        }

        if (type === 'alert') {
            btnCancel.classList.add('hidden');
        } else {
            btnCancel.classList.remove('hidden');
        }

        modal.classList.remove('hidden');

        const handleConfirm = () => {
            let val;
            if (type === 'prompt') val = input.value;
            else if (type === 'select') val = select.value;
            else val = true;
            cleanup(val);
        };

        const handleCancel = () => cleanup(null);

        const handleKey = (e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') handleCancel();
        };

        const cleanup = (value) => {
            modal.classList.add('hidden');
            btnConfirm.removeEventListener('click', handleConfirm);
            btnCancel.removeEventListener('click', handleCancel);
            input.removeEventListener('keypress', handleKey);
            select.removeEventListener('keypress', handleKey);
            window.removeEventListener('keydown', handleKey);

            isCustomModalOpen = false;
            resolve(value);
        };

        btnConfirm.addEventListener('click', handleConfirm);
        btnCancel.addEventListener('click', handleCancel);
        input.addEventListener('keypress', handleKey);
        select.addEventListener('keypress', handleKey);
        window.addEventListener('keydown', handleKey);
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
