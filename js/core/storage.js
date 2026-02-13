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
