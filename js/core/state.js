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
