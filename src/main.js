/**
 * Mind Weather - Core Engine
 * Zero-Cost Client-side Logic v1.2
 */

let currentQuestion = 0;
let totalScore = 0;
let questions = [];
let resultMapping = [];
let currentCareUrl = "";

// DOM Elements
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const loadingScreen = document.getElementById('loading-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('progress-bar-fill');
const questionNumber = document.getElementById('question-number');

const resultType = document.getElementById('result-type');
const resultSummary = document.getElementById('result-summary');
const resultImg = document.getElementById('result-img');
const careVideoText = document.getElementById('care-video-text');
const careTitleLabel = document.getElementById('care-title');

// 1. Fetch Data
async function init() {
    try {
        const qRes = await fetch('./content/questions/burnout_v1.json');
        const qData = await qRes.json();
        questions = qData.questions;

        const rRes = await fetch('./content/results/weather_mapping.json');
        const rData = await rRes.json();
        resultMapping = rData.results;
    } catch (err) {
        console.error("데이터 로딩 실패:", err);
    }
}

// 2. Start Test
startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    questionScreen.classList.add('active');
    displayQuestion();
});

// 3. Display Question
function displayQuestion() {
    if (currentQuestion >= questions.length) {
        showLoading();
        return;
    }

    const q = questions[currentQuestion];
    questionNumber.innerText = `Question ${String(currentQuestion + 1).padStart(2, '0')}`;
    questionText.innerText = q.text;
    
    // Progress
    progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

    // Clear Options
    optionsContainer.innerHTML = '';

    // Create Options
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => selectOption(opt.score);
        optionsContainer.appendChild(btn);
    });
}

// 4. Handle Option Selection
function selectOption(score) {
    totalScore += score;
    currentQuestion++;
    displayQuestion();
}

// 5. Loading Simulation (For premium feel)
function showLoading() {
    questionScreen.classList.remove('active');
    loadingScreen.classList.add('active');
    
    setTimeout(() => {
        loadingScreen.classList.remove('active');
        showResult();
    }, 2500);
}

// 6. Show Result
function showResult() {
    resultScreen.classList.add('active');
    
    // Find matching result
    const result = resultMapping.find(r => 
        totalScore >= r.score_range[0] && totalScore <= r.score_range[1]
    ) || resultMapping[0];

    resultType.innerText = result.type;
    resultType.style.color = result.color;
    resultSummary.innerText = result.diagnosis;
    resultImg.src = result.image_path;
    
    // Care Video Section Update
    careTitleLabel.innerText = result.care_title;
    currentCareUrl = result.care_video_url;
}

init();
