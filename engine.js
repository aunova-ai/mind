/**
 * Mind Weather - Core Engine V3.0.0
 * Dual-Axis (Weather/Humidity) Scoring & Dynamic Content Logic
 */
console.log("Aunova Mind Engine v3.0.0 Live (2-Axis Hybrid Scoring Active)");

let currentQuestion = 0;
let weatherScore = 0;
let humidityScore = 0;
let questions = []; // Will hold 10 MCs + 1 SUB
let resultMapping = [];
let currentCareUrl = "";

// DOM Elements
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const loadingScreen = document.getElementById('loading-screen');
const resultScreen = document.getElementById('result-screen');
const mcArea = document.getElementById('mc-area');
const subjectiveArea = document.getElementById('subjective-area');

const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('progress-bar-fill');
const questionNumber = document.getElementById('question-number');

const resultType = document.getElementById('result-type');
const resultDiagnosis = document.getElementById('result-diagnosis');
const resultImg = document.getElementById('result-img');
const careVideoText = document.getElementById('care-video-text');
const careTitleLabel = document.getElementById('care-title');

// 1. Fetch Data & Prepare 11 Questions
async function init() {
    try {
        // [완전 자동화] 사용자 접속 기기의 현재 날짜/월을 기반으로 작동
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const targetFile = `./content/questions/${currentYear}_${currentMonth}.json?v=` + Date.now();
        
        // 만약 해당 월의 파일이 없다면(예방책), 4월분(2026_04)을 기본값으로 Fallback
        let qRes;
        try {
            qRes = await fetch(targetFile);
            if (!qRes.ok) throw new Error("File not found");
        } catch(e) {
            console.warn(`[Fallback] ${targetFile} 가 없어 기본 4월(2026_04.json) 로딩합니다.`);
            qRes = await fetch('./content/questions/2026_04.json?v=' + Date.now());
        }
        
        const qData = await qRes.json();
        
        let allQuestions = qData.questions || qData; // 지원성을 위해 둘다 체크
        let mcQuestions = allQuestions.filter(q => q.type === 'MC');
        let subQuestions = allQuestions.filter(q => q.type === 'SUB');
        
        // 10개 카테고리에서 하나씩 랜덤 추출하여 배열 생성
        let selectedQuestions = [];
        for (let i = 1; i <= 10; i++) {
            let catId = `CAT-${String(i).padStart(2, '0')}`;
            let catQs = mcQuestions.filter(q => q.category_id === catId);
            if (catQs.length > 0) {
                selectedQuestions.push(catQs[Math.floor(Math.random() * catQs.length)]);
            }
        }
        
        // 주관식 1개 랜덤 추출하여 마지막에 배치
        let selectedSub = subQuestions[Math.floor(Math.random() * subQuestions.length)];
        if (selectedSub) {
            selectedQuestions.push(selectedSub);
        }
        
        questions = selectedQuestions;

        // 결과 매핑 JSON (임시 유지)
        const rRes = await fetch('./content/results/weather_result_v2.json?v=' + Date.now());
        const rData = await rRes.json();
        resultMapping = rData.results || rData;
    } catch (err) {
        console.error("데이터 로딩 실패:", err);
    }
}

// 2. Start Test
startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    questionScreen.classList.add('active');
    mcArea.style.display = 'block';
    subjectiveArea.classList.remove('active');
    currentQuestion = 0;
    weatherScore = 0;
    humidityScore = 0;
    displayQuestion();
});

// 3. Display Question
function displayQuestion() {
    if (currentQuestion >= questions.length || questions.length === 0) {
        return; // All done
    }

    const q = questions[currentQuestion];
    
    // Progress UI 업데이트
    progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

    // 11번째: 주관식 문항 처리
    if (q.type === 'SUB') {
        mcArea.style.display = 'none';
        
        // subjective area 안의 라벨을 동적으로 수정
        let subLabel = document.getElementById('subjective-question-text');
        if (!subLabel) {
            subLabel = document.createElement('h3');
            subLabel.id = 'subjective-question-text';
            subLabel.style.marginBottom = '20px';
            subjectiveArea.insertBefore(subLabel, subjectiveArea.firstChild);
        }
        subLabel.innerText = q.text;
        
        subjectiveArea.classList.add('active');
        return;
    }

    // 객관식 문항 노출
    questionNumber.innerText = `Question ${String(currentQuestion + 1).padStart(2, '0')} / 10`;
    questionText.innerText = q.text;
    optionsContainer.innerHTML = '';
    
    // Q.options가 배열인지 이전 포맷의 오브젝트 배열인지 체크하여 모두 호환
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        let optText = typeof opt === 'string' ? opt : opt.text;
        let score = typeof opt === 'string' ? q.scores[index] : opt.score;
        
        btn.innerText = optText;
        btn.onclick = () => selectOption(score, q.category_id);
        optionsContainer.appendChild(btn);
    });
}

// 4. Handle Option Selection & Dual Scoring
function selectOption(score, categoryId) {
    const weatherCats = ['CAT-01', 'CAT-03', 'CAT-05', 'CAT-07', 'CAT-09'];
    const humidityCats = ['CAT-02', 'CAT-04', 'CAT-06', 'CAT-08', 'CAT-10'];
    
    // 배열 방식 구조이므로 각 5개 문항 최대 10점 = 50점 만점 기준
    if (weatherCats.includes(categoryId)) {
        weatherScore += score; 
    } else if (humidityCats.includes(categoryId)) {
        humidityScore += score; 
    }
    
    currentQuestion++;
    displayQuestion();
}

// 5. Submit Final Response
submitBtn.addEventListener('click', () => {
    questionScreen.classList.remove('active');
    loadingScreen.classList.add('active');
    
    setTimeout(() => {
        loadingScreen.classList.remove('active');
        showResult();
    }, 2500);
});

// 6. Show Result (Dual Axis Interpretation)
function showResult() {
    resultScreen.classList.add('active');
    
    // 임시 로직: 기존 결과 매핑을 무시하고, 날씨와 습도의 복합 상태 출력
    // 날씨(에너지): 0~50 / 습도(우울도): 0~50
    let weatherResult = "흐릿함";
    if (weatherScore >= 40) weatherResult = "매우 맑음";
    else if (weatherScore >= 30) weatherResult = "맑고 화창함";
    else if (weatherScore >= 20) weatherResult = "구름 조금";
    
    // 습도 백분율 치환 (최대 50점을 100%로 환산)
    let humidityPercent = Math.min((humidityScore / 50) * 100, 100).toFixed(0);
    
    resultType.innerText = `현재 당신의 하늘: ${weatherResult}`;
    resultType.style.color = "#3b82f6";
    
    // 입체적 진단 문구 동적 생성 로직
    let diagnosisStr = `☀️ 에너지 충전율: ${weatherScore}/50 점\n💧 내면의 불쾌지수: ${humidityPercent}%\n\n`;
    
    if (weatherScore >= 30 && humidityScore >= 30) {
        diagnosisStr += "겉으로는 완벽하게 에너지를 뿜어내고 있지만 주변 시선을 크게 의식하고 있습니다. 속으로는 눅눅한 스트레스와 끈적한 고민을 가득 머금고 있네요. 이대로 무리하면 거대한 폭풍우가 쏟아질 수 있습니다. '스마일 마스크 징후'를 경계하세요!";
    } else if (weatherScore >= 30 && humidityScore < 30) {
        diagnosisStr += "에너지가 넘치고 내면의 습도도 낮아 쾌적한 상태입니다. 지금 이 순간을 온전히 즐기세요. 주변 사람들에게 긍정의 에너지를 나눠주는 태양이 될 수 있습니다.";
    } else if (weatherScore < 30 && humidityScore >= 30) {
        diagnosisStr += "에너지 레벨이 떨어져 구름이 끼었을 뿐 아니라, 내면의 우울도(습도)가 꽤 높습니다. 비가 오거나 답답한 안개가 낀 것처럼 혼자만의 동굴에 갇힌 느낌이 들 수 있습니다. 마음의 제습이 필요해요.";
    } else {
        diagnosisStr += "에너지는 다소 떨어져 있지만, 다행히 내면의 스트레스나 자책감(습도)은 거의 없는 편안하고 건조한 상태입니다. 조금만 푹 잠을 자거나 휴식하면 금방 하늘이 화창해질 수 있어요.";
    }
    
    const dummyResult = resultMapping.length > 0 ? resultMapping[0] : null;
    const animal = dummyResult ? dummyResult.animals[0] : { image: "" };
    
    resultDiagnosis.innerText = diagnosisStr;
    if(animal.image) resultImg.src = animal.image;
    
    // Care Video (일단 기존 매핑 사용)
    if(dummyResult){
        careTitleLabel.innerText = "지금 당신을 위한 마음의 제습 영상";
        currentCareUrl = dummyResult.care_video_url || "";
        careVideoText.innerText = `재생하기`;
    }
}

// 7. Event Listeners for Actions
document.getElementById('care-video-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (currentCareUrl) {
        const modal = document.getElementById('video-modal');
        const iframe = document.getElementById('video-iframe');
        iframe.src = currentCareUrl.replace('watch?v=', 'embed/').replace('shorts/', 'embed/');
        modal.classList.add('active');
    }
});

document.getElementById('close-modal-btn').onclick = () => {
    document.getElementById('video-modal').classList.remove('active');
    document.getElementById('video-iframe').src = "";
};
