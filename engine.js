/**
 * Mind Weather — Core Engine V3.1.0
 * Dual-Axis Scoring + Navigation + Share Logic
 */
console.log("Mind Weather Engine v3.1.0 (Rebuilt UI Compatible)");

// ──────────────────────────────────────────────
// 상태 변수
// ──────────────────────────────────────────────
let currentQuestion = 0;
let weatherScore    = 0;
let humidityScore   = 0;
let questions       = [];
let resultMapping   = [];
let currentCareUrl  = "";

// ──────────────────────────────────────────────
// DOM 레퍼런스
// ──────────────────────────────────────────────
const landingScreen    = document.getElementById('landing-screen');
const startScreen      = document.getElementById('start-screen');
const questionScreen   = document.getElementById('question-screen');
const loadingScreen    = document.getElementById('loading-screen');
const resultScreen     = document.getElementById('result-screen');

const appHeader        = document.getElementById('app-header');
const bottomNav        = document.getElementById('bottom-nav');

const mcArea           = document.getElementById('mc-area');
const subjectiveArea   = document.getElementById('subjective-area');
const startBtn         = document.getElementById('start-btn');
const submitBtn        = document.getElementById('submit-btn');
const questionText     = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar      = document.getElementById('progress-bar-fill');
const questionNumber   = document.getElementById('question-number');

const resultType       = document.getElementById('result-type');
const resultDiagnosis  = document.getElementById('result-diagnosis');
const resultImg        = document.getElementById('result-img');
const careVideoText    = document.getElementById('care-video-text');
const careTitleLabel   = document.getElementById('care-title');

// ──────────────────────────────────────────────
// 화면 전환 유틸리티
// ──────────────────────────────────────────────
const QUIZ_SCREENS   = ['question-screen', 'loading-screen'];
const NAV_TAB_SCREENS = ['start-screen', 'present-screen', 'video-screen', 'care-screen'];

/**
 * 지정 화면을 활성화하고 나머지 숨김
 * @param {string} screenId - 표시할 섹션 ID
 * @param {object} opts      - { showHeader, showNav }
 */
function showScreen(screenId, opts = {}) {
    const { showHeader = true, showNav = true } = opts;

    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    appHeader.style.display = showHeader ? 'flex' : 'none';
    bottomNav.style.display = showNav    ? 'flex' : 'none';
}

// ──────────────────────────────────────────────
// 전역 네비게이션 함수 (HTML onclick에서 호출)
// ──────────────────────────────────────────────
window.navigateTo = function(screenId, el) {
    showScreen(screenId);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    // 결과 화면에서 홈으로 이동 시 Home 탭 활성화
    if (screenId === 'start-screen') {
        const homeNav = document.querySelector('.nav-item[onclick*="start-screen"]');
        if (homeNav) homeNav.classList.add('active');
    }
};

window.openVideo = function(embedUrl) {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    iframe.src = embedUrl;
    modal.classList.add('active');
};

// ──────────────────────────────────────────────
// 1. 초기화: 데이터 로드
// ──────────────────────────────────────────────
async function init() {
    try {
        const today        = new Date();
        const currentYear  = today.getFullYear();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const targetFile   = `./content/questions/${currentYear}_${currentMonth}.json?v=` + Date.now();

        let qRes;
        try {
            qRes = await fetch(targetFile);
            if (!qRes.ok) throw new Error("not found");
        } catch(e) {
            console.warn(`[Fallback] ${targetFile} → 2026_04.json`);
            qRes = await fetch('./content/questions/2026_04.json?v=' + Date.now());
        }

        const qData = await qRes.json();
        const allQuestions = qData.questions || qData;
        const mcQuestions  = allQuestions.filter(q => q.type === 'MC');
        const subQuestions = allQuestions.filter(q => q.type === 'SUB');

        let selectedQuestions = [];
        for (let i = 1; i <= 10; i++) {
            const catId  = `CAT-${String(i).padStart(2, '0')}`;
            const catQs  = mcQuestions.filter(q => q.category_id === catId);
            if (catQs.length > 0) {
                selectedQuestions.push(catQs[Math.floor(Math.random() * catQs.length)]);
            }
        }

        const selectedSub = subQuestions[Math.floor(Math.random() * subQuestions.length)];
        if (selectedSub) selectedQuestions.push(selectedSub);

        questions = selectedQuestions;

        const rRes = await fetch('./content/results/weather_result_v2.json?v=' + Date.now());
        const rData = await rRes.json();
        resultMapping = rData.results || rData;

    } catch (err) {
        console.error("데이터 로딩 실패:", err);
    }
}

// ──────────────────────────────────────────────
// 2. 랜딩 → 대기화면
// ──────────────────────────────────────────────
landingScreen.addEventListener('click', () => {
    showScreen('start-screen');
    const homeNav = document.querySelector('.nav-item[onclick*="start-screen"]');
    if (homeNav) homeNav.classList.add('active');
});

// ──────────────────────────────────────────────
// 3. 대기화면 → 테스트 시작
// ──────────────────────────────────────────────
startBtn.addEventListener('click', () => {
    currentQuestion = 0;
    weatherScore    = 0;
    humidityScore   = 0;
    mcArea.style.display = 'block';
    subjectiveArea.style.display = 'none';
    showScreen('question-screen', { showHeader: true, showNav: true });
    displayQuestion();
});

// ──────────────────────────────────────────────
// 4. 문항 표시
// ──────────────────────────────────────────────
function displayQuestion() {
    if (questions.length === 0) {
        questionText.innerText = '질문을 불러오는 데 실패했습니다. 새로고침 해주세요.';
        return;
    }

    // 모든 문항 완료 → 로딩 → 결과
    if (currentQuestion >= questions.length) {
        showScreen('loading-screen', { showHeader: false, showNav: false });
        setTimeout(() => showResult(), 2500);
        return;
    }

    const q = questions[currentQuestion];

    // 진행 바
    progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

    // 주관식 (11번째)
    if (q.type === 'SUB') {
        mcArea.style.display = 'none';
        const subQ = document.getElementById('sub-question-text');
        if (subQ) subQ.innerText = q.text;
        subjectiveArea.style.display = 'flex';
        subjectiveArea.style.flexDirection = 'column';
        return;
    }

    // 객관식
    mcArea.style.display = 'block';
    subjectiveArea.style.display = 'none';
    questionNumber.innerText = `Question ${String(currentQuestion + 1).padStart(2, '0')} / 10`;
    questionText.innerText = q.text;
    optionsContainer.innerHTML = '';

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        const optText = typeof opt === 'string' ? opt : opt.text;
        const score   = typeof opt === 'string'
            ? (q.scores ? q.scores[index] : 1)
            : opt.score;
        btn.innerText = optText;
        btn.onclick = () => selectOption(score, q.category_id);
        optionsContainer.appendChild(btn);
    });
}

// ──────────────────────────────────────────────
// 5. 선택지 선택 (이중 축 채점)
// ──────────────────────────────────────────────
function selectOption(score, categoryId) {
    const weatherCats  = ['CAT-01', 'CAT-03', 'CAT-05', 'CAT-07', 'CAT-09'];
    const humidityCats = ['CAT-02', 'CAT-04', 'CAT-06', 'CAT-08', 'CAT-10'];

    if (weatherCats.includes(categoryId))  weatherScore  += score;
    if (humidityCats.includes(categoryId)) humidityScore += score;

    currentQuestion++;
    displayQuestion();
}

// ──────────────────────────────────────────────
// 6. 주관식 제출
// ──────────────────────────────────────────────
submitBtn.addEventListener('click', () => {
    subjectiveArea.style.display = 'none';
    showScreen('loading-screen', { showHeader: false, showNav: false });
    setTimeout(() => showResult(), 2500);
});

// ──────────────────────────────────────────────
// 7. 결과 화면
// ──────────────────────────────────────────────
function showResult() {
    showScreen('result-screen');

    // 날씨(에너지) 축: 50점 만점
    let weatherLabel = "흐릿함";
    let weatherImgSrc = "assets/cloudy.png";

    if (weatherScore >= 40) {
        weatherLabel  = "매우 맑음 ☀️";
        weatherImgSrc = "assets/clear.png";
    } else if (weatherScore >= 28) {
        weatherLabel  = "맑고 화창함 🌤";
        weatherImgSrc = "assets/clear.png";
    } else if (weatherScore >= 16) {
        weatherLabel  = "흐림 ⛅";
        weatherImgSrc = "assets/cloudy.png";
    } else {
        weatherLabel  = "폭풍 전야 🌧";
        weatherImgSrc = "assets/stormy.png";
    }

    // 습도(우울도) 축
    const humidityPercent = Math.min((humidityScore / 50) * 100, 100).toFixed(0);

    resultType.innerText = `오늘 내 하늘: ${weatherLabel}`;
    resultType.style.color = "#FFB347";

    // 이미지 분기 (4종)
    let finalImg = weatherImgSrc;
    if (weatherScore >= 28 && humidityScore >= 28) finalImg = "assets/cloudy.png";
    else if (weatherScore < 28 && humidityScore >= 28) finalImg = "assets/stormy.png";
    else if (weatherScore < 28 && humidityScore < 28)  finalImg = "assets/foggy.png";
    resultImg.src = finalImg;

    // 진단 문구
    let diagStr = `☀️ 에너지 충전율: ${weatherScore}/50점\n💧 내면 불쾌지수: ${humidityPercent}%\n\n`;

    if (weatherScore >= 28 && humidityScore >= 28) {
        diagStr += "겉으로는 에너지를 뿜어내지만 내면의 습도가 가득 찼어요. 스마일 마스크 징후를 조심하세요. 혼자 속으로만 삭이지 말고 오늘 한 분이라도 솔직하게 털어놔 보세요.";
    } else if (weatherScore >= 28 && humidityScore < 28) {
        diagStr += "에너지도 넘치고 내면도 쾌적한 맑은 상태예요! 오늘 하루 주변 사람들에게 긍정 에너지를 나눠줄 수 있는 최상의 날입니다. 이 기분을 마음껏 즐기세요 ☀️";
    } else if (weatherScore < 28 && humidityScore >= 28) {
        diagStr += "에너지가 낮고 내면의 우울도(습도)도 높은 상태예요. 비가 오거나 안개가 낀 것처럼 혼자 동굴에 갇힌 느낌이 드실 수 있어요. 마음의 제습이 필요한 시간입니다.";
    } else {
        diagStr += "에너지가 조금 낮지만 내면의 스트레스는 거의 없어요. 잠시 쉬면 금방 화창해질 안개 낀 아침 같은 상태예요. 오늘은 충분한 휴식을 챙겨보세요. 🌫️";
    }

    resultDiagnosis.innerText = diagStr;

    // 처방 영상
    const dummyResult = resultMapping.length > 0 ? resultMapping[0] : null;
    if (dummyResult) {
        careTitleLabel.innerText = "지금 당신을 위한 마음의 처방 영상";
        currentCareUrl = dummyResult.care_video_url || "";
        careVideoText.innerText = "재생하기";
    }
}

// ──────────────────────────────────────────────
// 8. 처방 영상 버튼
// ──────────────────────────────────────────────
document.getElementById('care-video-btn').addEventListener('click', () => {
    if (currentCareUrl) {
        const modal  = document.getElementById('video-modal');
        const iframe = document.getElementById('video-iframe');
        iframe.src   = currentCareUrl
            .replace('watch?v=', 'embed/')
            .replace('shorts/', 'embed/');
        modal.classList.add('active');
    }
});

document.getElementById('close-modal-btn').onclick = () => {
    document.getElementById('video-modal').classList.remove('active');
    document.getElementById('video-iframe').src = "";
};

// ──────────────────────────────────────────────
// 9. 공유하기 (이미지+링크)
// ──────────────────────────────────────────────
document.getElementById('share-btn').addEventListener('click', async () => {
    const appUrl     = 'https://mind-dusky-gamma.vercel.app';
    const resultText = resultType.innerText;
    const shareText  = `🌤 내 마음 날씨 진단 결과\n"${resultText}"\n\n직접 체험해보세요 👇\n${appUrl}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Mind Weather — 내 마음의 기상청',
                text:  shareText,
                url:   appUrl
            });
        } catch (e) {
            console.log('Share cancelled:', e);
        }
    } else {
        // 데스크탑 폴백: 클립보드 복사
        try {
            await navigator.clipboard.writeText(shareText);
            showToast('링크가 복사되었습니다! 💫');
        } catch (e) {
            prompt('아래 텍스트를 복사해 공유하세요:', shareText);
        }
    }
});

// ──────────────────────────────────────────────
// 10. 다시하기 버튼
// ──────────────────────────────────────────────
document.getElementById('retry-btn').addEventListener('click', () => {
    currentQuestion = 0;
    weatherScore    = 0;
    humidityScore   = 0;
    showScreen('start-screen');
    const homeNav = document.querySelector('.nav-item[onclick*="start-screen"]');
    if (homeNav) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        homeNav.classList.add('active');
    }
});

// ──────────────────────────────────────────────
// 11. 토스트 메시지
// ──────────────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.style.cssText = `
            position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.75); color: #fff;
            padding: 12px 24px; border-radius: 50px;
            font-size: 14px; font-weight: 600;
            z-index: 999; opacity: 0; transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ──────────────────────────────────────────────
// 실행
// ──────────────────────────────────────────────
init();
