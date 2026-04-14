import json
import random
import os

# 디렉토리 설정
OUTPUT_DIR = "c:\\antigravity\\aunova_mind\\content\\questions"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 기초 데이터베이스
CATEGORIES = [
    {"id": "CAT-01", "name": "자기효능감", "themes": ["성취", "자신감", "의지", "시작"]},
    {"id": "CAT-02", "name": "정서 안정성", "themes": ["평화", "불안", "파도", "아침"]},
    {"id": "CAT-03", "name": "사회적 상호작용", "themes": ["대화", "모임", "친구", "소통"]},
    {"id": "CAT-04", "name": "회복 탄력성", "themes": ["실수", "실패", "극복", "비온뒤"]},
    {"id": "CAT-05", "name": "인지적 유연성", "themes": ["변화", "새로움", "바람", "여행"]},
    {"id": "CAT-06", "name": "사회적 민감성", "themes": ["시선", "공감", "온도", "배려"]},
    {"id": "CAT-07", "name": "미래 낙관성", "themes": ["내일", "희망", "해돋이", "꿈"]},
    {"id": "CAT-08", "name": "삶의 만족도", "themes": ["행복", "일상", "저녁", "미소"]},
    {"id": "CAT-09", "name": "위기 대처", "themes": ["소나기", "돌발", "당황", "차분함"]},
    {"id": "CAT-10", "name": "친밀도/관계", "themes": ["우산", "비밀", "신뢰", "가족"]}
]

CHARACTERS = ["Quokka", "Panda", "Rabbit", "Lion"]

# 월별 테마 (1월 ~ 12월)
MONTHLY_THEMES = [
    "새해 결심", "관계의 온기", "변화와 성장", "봄 에너지와 회복", 
    "가정과 감사", "중간 점검", "도전과 활기", "휴식과 충전", 
    "수확과 성취", "감정 비우기", "포용과 연결", "한 해의 수용"
]

def generate_options():
    options = [
        ["완전 그래요!", "아마 그럴걸요?", "글쎄요..", "전혀 아닙니다."],
        ["당장 행동한다", "조금 지켜본다", "주변에 묻는다", "모른 척 한다"],
        ["무척 설렌다", "조금 기대된다", "걱정이 앞선다", "피하고 싶다"],
        ["아주 편안하다", "나쁘지 않다", "조금 불편하다", "빨리 벗어나고 싶다"]
    ]
    return random.choice(options)

def generate_expert_comment(char, cat_name):
    comments = {
        "Quokka": f"[긍정의 쿼카] 무조건 잘할 수 있어요! 당신의 {cat_name}을 믿어봐요!",
        "Panda": f"[평온한 판다] 너무 서두를 필요 없어요. 내면에 집중하는 {cat_name}이 필요해요.",
        "Rabbit": f"[공감의 토끼] 당신의 마음에 너무 공감해요. {cat_name}의 온도를 느껴보세요.",
        "Lion": f"[용감한 사자] 두려워 말고 부딪혀 보세요. {cat_name}은 당신의 무기입니다!"
    }
    return comments[char]

def generate_month_data(year, month):
    questions = []
    month_theme = MONTHLY_THEMES[month - 1]
    
    # 객관식 100문항 (10개 카테고리 x 10개)
    q_index = 1
    for cat in CATEGORIES:
        for _ in range(10):
            theme_word = random.choice(cat["themes"])
            q_text = f"[{month_theme}] 테마 질문: 당신이 '{theme_word}'(이)라는 상황에 직면했을 때, 당신의 첫 반응은?"
            opts = generate_options()
            scores = [10, 7, 3, 0]
            char_id = random.choice(CHARACTERS)
            
            q = {
                "id": f"{year}{month:02d}-{q_index:03d}",
                "month": month,
                "category_id": cat["id"],
                "type": "MC",
                "text": q_text,
                "options": opts,
                "scores": scores,
                "character_id": char_id,
                "expert_comment": generate_expert_comment(char_id, cat["name"]),
                "video_url_id": ""
            }
            questions.append(q)
            q_index += 1
            
    # 주관식 10문항
    for i in range(10):
        q = {
            "id": f"{year}{month:02d}-{q_index:03d}",
            "month": month,
            "category_id": "CAT-SUB",
            "type": "SUB",
            "text": f"이번 달의 나의 감정 일기: '{month_theme}'에 대해 자유롭게 써보세요. ({i+1}/10)",
            "options": [],
            "scores": [],
            "character_id": "Quokka",
            "expert_comment": "당신의 솔직한 내면 이야기를 들려주어 고마워요.",
            "video_url_id": ""
        }
        questions.append(q)
        q_index += 1

    return {
        "meta": {
            "year": year,
            "month": month,
            "theme": month_theme,
            "total": 110,
            "mc_count": 100,
            "sub_count": 10
        },
        "questions": questions
    }

def main():
    print("🚀 마인드웨더 12개월(1,320문항) 자동 생성 엔진 가동...")
    year = 2026
    for month in range(1, 13):
        data = generate_month_data(year, month)
        filename = os.path.join(OUTPUT_DIR, f"{year}_{month:02d}.json")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ {filename} 생성 완료 ({len(data['questions'])}문항)")
        
    print("🎉 1년 치 문항 파이프라인 생성 완료!")

if __name__ == "__main__":
    main()
