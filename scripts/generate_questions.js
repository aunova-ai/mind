const fs = require('fs');
const path = require('path');

// 디렉토리 설정
const OUTPUT_DIR = path.join('c:', 'antigravity', 'aunova_mind', 'content', 'questions');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 기초 데이터베이스
const CATEGORIES = [
    { id: "CAT-01", name: "개인의 활력 (Weather)", themes: ["아침", "건강", "의욕", "취미"] },
    { id: "CAT-02", name: "개인의 자책 (Humidity)", themes: ["거울", "자책", "후회", "비교"] },
    { id: "CAT-03", name: "관계의 활력 (Weather)", themes: ["모임", "소통", "즐거움", "공감"] },
    { id: "CAT-04", name: "관계의 피로 (Humidity)", themes: ["시선", "소모감", "소외감", "침묵"] },
    { id: "CAT-05", name: "정서적 여유 (Weather)", themes: ["평화", "저녁", "차분함", "산책"] },
    { id: "CAT-06", name: "정서적 불안 (Humidity)", themes: ["무기력", "외로움", "널뛰기", "밤"] },
    { id: "CAT-07", name: "회복 탄력성 (Weather)", themes: ["실수", "극복", "다짐", "전환"] },
    { id: "CAT-08", name: "스트레스 취약성 (Humidity)", themes: ["돌발", "당황", "무력감", "패닉"] },
    { id: "CAT-09", name: "미래 낙관성 (Weather)", themes: ["내일", "기대", "목표", "설렘"] },
    { id: "CAT-10", name: "미래 막막함 (Humidity)", themes: ["막연함", "안개", "두려움", "답답함"] }
];

const CHARACTERS = ["Quokka", "Panda", "Rabbit", "Lion"];

// 월별 테마 (1월 ~ 12월)
const MONTHLY_THEMES = [
    "새해 결심", "관계의 온기", "변화와 성장", "봄 에너지와 회복", 
    "가정과 감사", "중간 점검", "도전과 활기", "휴식과 충전", 
    "수확과 성취", "감정 비우기", "포용과 연결", "한 해의 수용"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateOptions() {
    const optionsArray = [
        ["완전 그래요!", "아마 그럴걸요?", "상황에 따라 달라요", "글쎄요..", "전혀 아닙니다."],
        ["당장 행동한다", "일단 계획부터 세운다", "조금 지켜본다", "주변에 먼저 묻는다", "모른 척 피한다"],
        ["무척 설레고 기대된다", "조금은 기대된다", "덤덤하다", "걱정이 앞선다", "도망치고 싶다"],
        ["아주 편안하고 좋다", "나쁘지 않다", "그저 그렇다", "조금 불편하다", "빨리 상황을 벗어나고 싶다"]
    ];
    return getRandomItem(optionsArray);
}

function generateExpertComment(char, catName) {
    const comments = {
        "Quokka": `[긍정의 쿼카] 무조건 잘할 수 있어요! 당신의 ${catName}을 믿어봐요!`,
        "Panda": `[평온한 판다] 너무 서두를 필요 없어요. 내면에 집중하는 ${catName}이 필요해요.`,
        "Rabbit": `[공감의 토끼] 당신의 마음에 너무 공감해요. ${catName}의 온도를 느껴보세요.`,
        "Lion": `[용감한 사자] 두려워 말고 부딪혀 보세요. ${catName}은 당신의 무기입니다!`
    };
    return comments[char];
}

function generateMonthData(year, month) {
    let questions = [];
    let monthTheme = MONTHLY_THEMES[month - 1];
    
    let qIndex = 1;
    // 객관식 100문항 (10개 카테고리 x 10개)
    CATEGORIES.forEach(cat => {
        for (let i = 0; i < 10; i++) {
            let themeWord = getRandomItem(cat.themes);
            let qText = `[${monthTheme}] 테마 질문: 당신이 '${themeWord}'(이)라는 상황에 직면했을 때, 당신의 첫 반응은?`;
            let opts = generateOptions();
            let charId = getRandomItem(CHARACTERS);
            
            questions.push({
                id: `${year}${String(month).padStart(2, '0')}-${String(qIndex).padStart(3, '0')}`,
                month: month,
                category_id: cat.id,
                type: "MC",
                text: qText,
                options: opts,
                scores: [10, 8, 5, 3, 0],
                character_id: charId,
                expert_comment: generateExpertComment(charId, cat.name),
                video_url_id: ""
            });
            qIndex++;
        }
    });
            
    // 주관식 10문항
    for (let i = 0; i < 10; i++) {
        questions.push({
            id: `${year}${String(month).padStart(2, '0')}-${String(qIndex).padStart(3, '0')}`,
            month: month,
            category_id: "CAT-SUB",
            type: "SUB",
            text: `이번 달의 나의 감정 일기: '${monthTheme}'에 대해 자유롭게 써보세요. (${i + 1}/10)`,
            options: [],
            scores: [],
            character_id: "Quokka",
            expert_comment: "당신의 솔직한 내면 이야기를 들려주어 고마워요.",
            video_url_id: ""
        });
        qIndex++;
    }

    return {
        meta: {
            year: year,
            month: month,
            theme: monthTheme,
            total: 110,
            mc_count: 100,
            sub_count: 10
        },
        questions: questions
    };
}

console.log("🚀 마인드웨더 12개월(1,320문항) 자동 생성 엔진 가동...");
let year = 2026;
for (let month = 1; month <= 12; month++) {
    let data = generateMonthData(year, month);
    let filename = path.join(OUTPUT_DIR, `${year}_${String(month).padStart(2, '0')}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${filename} 생성 완료 (${data.questions.length}문항)`);
}
console.log("🎉 1년 치(1,320문항) 문항 파이프라인 생성 완벽하게 완료되었습니다!");
