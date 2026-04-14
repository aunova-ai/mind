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
const videoScreen      = document.getElementById('video-screen');

const appHeader        = document.getElementById('app-header');
const bottomNav        = document.getElementById('bottom-nav');
const appContainer     = document.getElementById('app-container');

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
const videoListEl      = document.getElementById('video-list');

// ──────────────────────────────────────────────
// 비디오 콘텐츠 데이터 (자동화 대비 구조)
// ──────────────────────────────────────────────
// 진단 결과 영상 매핑 (배열로 관리하여 랜덤 재생 지원)
let resultVideoMap = {
    "clear":  ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
    "cloudy": ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
    "stormy": ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
    "foggy":  ["https://www.youtube.com/embed/dQw4w9WgXcQ"]
};

// Video 탭 추천 플레이리스트 목록
const featuredVideos = [
    {
        title: "마음 날씨 처방 영상",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    }
];

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

        // 결과 영상 매핑 (CSV 다중 영상 로드)
        try {
            // [Zero-cost CMS] 구글 스프레드시트 실시간 연동 (링크 공유 설정된 ID)
            const sheetId = "16MxoVZBPwWKNKBlzpqFafZRzGevRB0yI9VDPKBrmdT0";
            const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&v=${Date.now()}`;
            const localCsvUrl = `./content/care_videos_template.csv?v=${Date.now()}`;

            let csvRes;
            try {
                // 1순위: 구글 시트 (실시간 반영)
                csvRes = await fetch(googleSheetUrl);
                if (!csvRes.ok) throw new Error("Google Sheet fetch failed");
                console.log("Successfully loaded care videos from Google Sheets");
            } catch (err) {
                // 2순위: 로컬 CSV (네트워크 문제나 CORS 대비)
                console.warn("[CMS Fallback] Google Sheet failed, loading local CSV...");
                csvRes = await fetch(localCsvUrl);
            }

            if(csvRes.ok) {
                const csvText = await csvRes.text();
                const rows = csvText.split('\n');
                
                // 데이터 정화 처리 (불러오기 성공 시 초기화)
                resultVideoMap = { "clear":[], "cloudy":[], "stormy":[], "foggy":[] };
                
                rows.slice(1).forEach(row => {
                    // 콤마(,) 기준 파싱 (따옴표 내 콤마 무시 등 복잡한 파싱은 생략, 대신 기본 주소만 체크)
                    const cols = row.split(',');
                    if(cols.length >= 4) {
                        const state = cols[0].trim();
                        let url = cols[3].trim();
                        
                        // 유튜브 링크만 필터링
                        if(url && url.includes('http') && resultVideoMap[state]) {
                            // 공유 주소를 임베드 주소로 변환 (필수)
                            if (url.includes('watch?v=')) url = url.replace('watch?v=', 'embed/');
                            if (url.includes('youtu.be/')) url = url.replace('youtu.be/', 'www.youtube.com/embed/');
                            
                            resultVideoMap[state].push(url);
                        }
                    }
                });
            }
        } catch(e) { console.error('Video mapping final failure:', e); }

        // Video 탭 목록 렌더링
        renderVideoTab();

    } catch (err) {
        console.error("데이터 로딩 실패:", err);
    }
}

// ──────────────────────────────────────────────
// 동영상 탭 플레이리스트 렌더링 (유튜브 RSS 자동 연동)
// ──────────────────────────────────────────────
async function renderVideoTab() {
    if(!videoListEl) return;
    videoListEl.innerHTML = '<div style="padding:40px; text-align:center; color:#888; font-size:14px; grid-column:1/-1;">채널 최신 영상을 불러옵니다...</div>';

    let vidsToRender = featuredVideos; // 폴백용 배열

    try {
        // Aunova 채널 고유 ID를 이곳에 입력 (추후 대표님이 채널 설정에서 확인 후 교체)
        const channelId = "UCSEhvpdirLIrhddApULC9lg"; 
        // fallback 테스트 시 유명 채널 UC_x5XG1OV2P6uZZ5FSM9Ttw 등으로 확인 가능합니다.
        const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        const apiStr = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
        
        const res = await fetch(apiStr);
        const data = await res.json();
        
        if(data.status === 'ok' && data.items && data.items.length > 0) {
            vidsToRender = data.items.map(item => ({
                title: item.title,
                thumbnailUrl: item.thumbnail,
                embedUrl: item.link.replace('watch?v=', 'embed/')
            }));
        }
    } catch(err) {
        console.warn("RSS 연동 실패, 기본 비디오 노출");
    }

    videoListEl.innerHTML = '';
    
    vidsToRender.forEach(vid => {
        const card = document.createElement('div');
        card.className = 'video-thumb-card';
        card.onclick = () => openVideo(vid.embedUrl);
        
        card.innerHTML = `
            <div class="video-thumb-image" style="background-image: url('${vid.thumbnailUrl}')">
                <div class="video-thumb-play-icon">▶</div>
            </div>
            <span class="video-thumb-title">${vid.title}</span>
        `;
        videoListEl.appendChild(card);
    });
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
    let weatherState = "foggy"; // 결과 구분용 코드
    let weatherImgSrc = "assets/cloudy.png";

    if (weatherScore >= 40) {
        weatherLabel  = "매우 맑음 ☀️";
    } else if (weatherScore >= 28) {
        weatherLabel  = "맑고 화창함 🌤";
    } else if (weatherScore >= 16) {
        weatherLabel  = "흐림 ⛅";
    } else {
        weatherLabel  = "폭풍 전야 🌧";
    }

    // 습도(우울도) 축
    const humidityPercent = Math.min((humidityScore / 50) * 100, 100).toFixed(0);

    resultType.innerText = `오늘 내 하늘: ${weatherLabel}`;
    resultType.style.color = "#FFB347";

    // 이미지 분기 (4종)
    let finalImg = "assets/clear.png";
    if (weatherScore >= 28 && humidityScore >= 28) {
        finalImg = "assets/cloudy.png";
        weatherState = "cloudy";
    }
    else if (weatherScore < 28 && humidityScore >= 28) {
        finalImg = "assets/stormy.png";
        weatherState = "stormy";
    }
    else if (weatherScore < 28 && humidityScore < 28) {
        finalImg = "assets/foggy.png";
        weatherState = "foggy";
    } else {
        weatherState = "clear";
    }
    
    resultImg.src = finalImg;

    // 진단 문구
    let diagStr = `☀️ 에너지 충전율: ${weatherScore}/50점\n💧 내면 불쾌지수: ${humidityPercent}%\n\n`;

    if (weatherScore >= 28 && humidityScore >= 28) {
        diagStr += "[스마일 마스크 증후군 ⛅]\n속은 타들어가지만 겉으로는 티 내지 않고 무리해서 웃으며 에너지를 쓰고 있는 상태.\n\n겉으로는 활기차 보이지만, 내면에는 꽤 많은 피로와 불안감이 쌓여있습니다. 남의 시선보다 내 마음을 먼저 돌보며 잠시 숨을 고르는 시간이 꼭 필요합니다.";
    } else if (weatherScore >= 28 && humidityScore < 28) {
        diagStr += "[최상의 맑음 ☀️]\n긍정적인 에너지가 충만하고 스트레스가 없는 상태.\n\n현재 에너지가 높고 마음이 매우 가볍습니다. 이 긍정적인 기운을 주변과 나누거나 새로운 도전에 나서기 아주 좋은 상태입니다. 이 기분을 마음껏 즐기세요!";
    } else if (weatherScore < 28 && humidityScore >= 28) {
        diagStr += "[에너지 방전/우울 🌧]\n에너지가 고갈되었고 극심한 번아웃과 우울감이 쏟아지고 있는 상태.\n\n마음의 방어선이 약해져 작은 일에도 크게 상처받고 휘청일 수 있습니다. 지금은 스스로를 절대 탓하지 말고, 무조건 마음의 비를 피하며 안전한 곳에서 푹 쉬는 것이 최우선입니다.";
    } else {
        diagStr += "[무기력/안개 🌫]\n심각한 스트레스는 없지만, 모든 것이 귀찮고 머릿속이 멍한 상태.\n\n마치 짙은 안개 속에 있는 것처럼 의욕이 생기지 않고 전체적인 에너지가 가라앉아 있습니다. 거창한 목표보다는 가벼운 산책과 충분한 수면으로 뇌를 환기해보세요.";
    }

    resultDiagnosis.innerText = diagStr;

    // 처방 영상 연결 로직 (상태별 영상 랜덤 매핑)
    careTitleLabel.innerText = "지금 당신을 위한 맞춤 처방 영상";
    const videoArray = resultVideoMap[weatherState] && resultVideoMap[weatherState].length > 0
        ? resultVideoMap[weatherState] 
        : ["https://www.youtube.com/embed/dQw4w9WgXcQ"];
    
    currentCareUrl = videoArray[Math.floor(Math.random() * videoArray.length)];
    careVideoText.innerText = "재생하기";
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
// 9. 공유하기 (클립보드 폴백 보완)
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
            return;
        } catch (e) {
            console.log('Share API cancelled or failed:', e);
        }
    } 
    
    // PC 및 폴백: 텍스트에어리어 생성 방식 클립보드 복사
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareText);
            showToast('링크가 복사되었습니다! 💫');
        } else {
            // 오래된 브라우저나 비보안 보안 컨텍스트 폴백
            let textArea = document.createElement("textarea");
            textArea.value = shareText;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
            showToast('링크가 복사되었습니다! 💫');
        }
    } catch (err) {
        prompt('아래 텍스트를 복사해 공유하세요:', shareText);
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
            position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.85); color: #fff;
            padding: 14px 28px; border-radius: 50px;
            font-size: 15px; font-weight: 700;
            z-index: 9999; opacity: 0; transition: opacity 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            pointer-events: none;
        `;
        appContainer.appendChild(toast); // body 대신 app-container 안에 넣어 확실히 보이게
    }
    toast.innerText = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ──────────────────────────────────────────────
// 실행
// ──────────────────────────────────────────────
init();
