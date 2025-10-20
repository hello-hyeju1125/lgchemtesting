# 리더를 위한 통합형 코칭피드백 AI 시스템 (lgchemtesting)

효과적인 리더십을 위한 AI 기반 통합 코칭 솔루션입니다. 1:1 미팅 프렙팩 생성, 팀원 인사이트 리포트, Issue Navigator 연습을 통해 리더의 코칭 역량을 향상시킵니다.

## 🚀 주요 기능

### 1. 1:1 미팅 프렙팩 생성
- 팀원별 맞춤형 미팅 준비 자료 자동 생성
- 개인 프로필 분석을 통한 코칭 질문 생성
- 상황별 코칭 메세지 및 미팅 가이드라인 제공
- GROW 모델, STAR 방법 등 코칭 기법 활용

### 2. 팀원 인사이트 리포트
- 감정 분석을 통한 팀원 상태 파악
- 스트레스/몰입 요인 분석
- 성과 트렌드 및 강점/개선 영역 식별
- 맞춤형 지원 방안 제안

### 3. Issue Navigator 연습
- 다양한 시나리오 기반 코칭 연습
- 실시간 AI 피드백 및 코칭 제안
- 대화 품질 분석 및 점수 제공
- 페르소나 기반 현실적인 대화 시뮬레이션

### 4. 실시간 음성 대화 🎤
- 음성으로 AI와 자연스러운 대화 가능
- 자동 음성 인식 (STT) - Web Speech API / OpenAI Whisper
- AI 음성 응답 (TTS) - OpenAI TTS / 브라우저 내장 TTS
- **자동 폴백 기능**: OpenAI TTS 실패 시 자동으로 브라우저 TTS로 전환
- 한국어, 영어 등 다국어 지원

## 🛠️ 기술 스택

- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-4
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Tailwind CSS
- **감정 분석**: Sentiment.js
- **기타**: Moment.js, UUID

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/hello-hyeju1125/lgchemtesting.git
cd lgchemtesting
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열어 OpenAI API 키를 설정하세요:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 5. 웹 브라우저에서 접속
```
http://localhost:3000
```

## 📚 API 문서

### 1:1 미팅 프렙팩 API

#### 미팅 프렙팩 생성
```http
POST /api/meeting-prep/generate
Content-Type: application/json

{
  "teamMember": {
    "name": "김철수",
    "position": "시니어 개발자",
    "department": "개발팀",
    "workStyle": "분석형",
    "recentProjects": "AI 프로젝트 리드"
  }
}
```

#### 템플릿 조회
```http
GET /api/meeting-prep/templates
```

### 팀원 인사이트 리포트 API

#### 리포트 생성
```http
POST /api/insight-report/generate
Content-Type: application/json

{
  "teamMember": {
    "name": "이영희",
    "position": "프로덕트 매니저",
    "department": "기획팀"
  },
  "feedbackData": [
    {
      "content": "최근 프로젝트에서 훌륭한 성과를 보여주었습니다.",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 감정 분석
```http
POST /api/insight-report/analyze-emotions
Content-Type: application/json

{
  "textData": "분석할 텍스트 내용"
}
```

### Issue Navigator API

#### 세션 시작
```http
POST /api/role-playing/start-session
Content-Type: application/json

{
  "teamMemberProfile": {
    "name": "박민수",
    "position": "주니어 개발자",
    "department": "개발팀"
  },
  "scenario": "performance_review",
  "coachingGoals": ["피드백 제공", "동기부여"]
}
```

#### 대화 진행
```http
POST /api/role-playing/conversation
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "userMessage": "안녕하세요, 최근 업무는 어떠신가요?"
}
```

#### 세션 종료
```http
POST /api/role-playing/end-session
Content-Type: application/json

{
  "sessionId": "session-uuid"
}
```

## 🎯 사용 시나리오

### 시나리오 1: 성과 평가 미팅 준비
1. 팀원 정보 입력
2. 1:1 미팅 프렙팩 생성
3. 맞춤형 코칭 질문 및 가이드라인 확인
4. 미팅 진행 후 피드백 반영

### 시나리오 2: 팀원 상태 파악
1. 피드백 데이터 수집
2. 인사이트 리포트 생성
3. 감정 트렌드 및 스트레스 요인 분석
4. 맞춤형 지원 방안 수립

### 시나리오 3: 코칭 역량 개발
1. 시나리오 선택 (성과 평가, 갈등 해결 등)
2. Issue Navigator 세션 시작
3. 실시간 코칭 연습 및 피드백
4. 세션 종료 후 성과 분석

## 🔧 개발 가이드

### 프로젝트 구조
```
src/
├── index.js                 # 메인 서버 파일
├── routes/                  # API 라우터
│   ├── meetingPrep.js      # 미팅 프렙팩 API
│   ├── insightReport.js    # 인사이트 리포트 API
│   └── rolePlaying.js      # 롤플레잉 API
├── services/               # 비즈니스 로직
│   ├── meetingPrepService.js
│   ├── insightReportService.js
│   └── rolePlayingService.js
└── middleware/             # 미들웨어
    ├── validation.js       # 유효성 검사
    ├── errorHandler.js     # 에러 처리
    └── requestLogger.js    # 요청 로깅

public/
├── index.html              # 메인 페이지
└── js/
    └── app.js              # 프론트엔드 로직
```

### 새로운 기능 추가
1. `src/services/`에 서비스 로직 구현
2. `src/routes/`에 API 엔드포인트 추가
3. `public/js/app.js`에 프론트엔드 로직 추가
4. 필요시 `src/middleware/`에 미들웨어 추가

## 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage
```

## 📈 성능 최적화

- OpenAI API 호출 최적화
- 캐싱 전략 구현
- 데이터베이스 연동 (선택사항)
- 로드 밸런싱 (대규모 배포시)

## 🔒 보안 고려사항

- API 키 보안 관리
- 입력 데이터 검증
- CORS 설정
- Rate Limiting 구현

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🔧 문제 해결

음성 대화, API 키 설정, 서버 실행 등의 문제 해결 방법은 **[트러블슈팅 가이드](./TROUBLESHOOTING.md)**를 참조하세요.

주요 해결 사항:
- ✅ OpenAI TTS API 할당량 초과 시 자동 폴백
- ✅ 음성 인식 네트워크 오류 해결
- ✅ 환경 변수 설정 문제
- ✅ 포트 충돌 해결

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**리더를 위한 통합형 코칭피드백 AI 시스템**으로 더 나은 리더십을 실현하세요! 🚀
