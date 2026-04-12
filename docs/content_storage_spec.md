# 📂 마인드웨더 콘텐츠 저장 구조 및 데이터 규격 (Content Storage Specification)

본 문서는 Amanager(Antigravity)가 정의한 심리 테스트 문제, 평가지, 설문지의 저장 위치와 데이터 구조 표준입니다. 모든 에이전트는 본 규격에 맞춰 데이터를 생성하여 `src/content/` 하위에 저장합니다.

---

## 💎 1. 저장 디렉토리 구조 (Directory Hierarchy)

| 위치 | 용도 | 담당 에이전트 |
| :--- | :--- | :--- |
| `src/content/questions/` | 심리 테스트 문항 데이터 (JSON) | Spark (창작) |
| `src/content/results/` | 결과지 텍스트 및 점수 맵핑 (JSON) | Copy (마케팅) |
| `src/content/surveys/` | 소모임/오픈톡 전환용 설문지 (JSON) | Bond (커뮤니티) |

---

## 💎 2. 데이터 규격 상세 (Data Schema)

### 2-1. 심리 테스트 문항 (`questions/burnout_v1.json`)
```json
{
  "test_id": "weather_burnout_01",
  "title": "번아웃 기상 특보: 내 마음의 날씨는?",
  "questions": [
    {
      "id": 1,
      "text": "오늘 아침, 눈을 떳을 때의 기분은 어떤가요?",
      "options": [
        {"text": "상쾌한 아침 햇살 같다", "score": 0},
        {"text": "자욱한 안개 속인 것 같다", "score": 5},
        {"text": "폭풍우가 치기 전 고요함 같다", "score": 10}
      ]
    }
  ]
}
```

### 2-2. 결과 맵핑 및 평가지 (`results/weather_mapping.json`)
```json
{
  "mapping": [
    {"range": [0, 25], "type": "맑음", "image_id": "clear_01", "summary": "충분한 에너지를 가진 상태"},
    {"range": [26, 50], "type": "흐림", "image_id": "cloudy_01", "summary": "휴식이 필요한 전조 증상"},
    {"range": [51, 75], "type": "안개", "image_id": "foggy_01", "summary": "방향을 잃은 번아웃 상태"},
    {"range": [76, 100], "type": "폭풍", "image_id": "stormy_01", "summary": "즉각적인 격리가 필요한 폭발 상태"}
  ]
}
```

### 2-3. 커뮤니티 전환 설문 (`surveys/community_entry.json`)
```json
{
  "survey_id": "mind_playground_entrance",
  "goal": "소모임 및 오픈톡 유입",
  "questions": [
    {"text": "비슷한 날씨를 가진 사람들과 대화하고 싶나요?", "type": "yes_no"},
    {"text": "어떤 활동(명상, 대화, 독서)을 선호하시나요?", "type": "multiple_choice"}
  ]
}
```

---

## 💎 3. 향후 액션 (Next Actions)

1.  **Spark**: `src/content/questions/`에 10문항 전체를 생성하여 저장.
2.  **Copy**: `src/content/results/`에 4대 날씨별 초정밀 진단 텍스트를 작성하여 저장.
3.  **Bond**: `src/content/surveys/`에 소모임 모집을 위한 사전 설문 문항을 확정하여 저장.

---
*Created by Amanager on 2026-04-12*
