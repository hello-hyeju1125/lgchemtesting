# 트러블슈팅 가이드

## 🔊 음성 대화 (TTS) 문제 해결

### 문제: OpenAI TTS API 오류 (429 - 할당량 초과)

#### 증상
```
❌ OpenAI TTS 오류: Error: TTS 생성 실패
429 You exceeded your current quota, please check your plan and billing details.
```

#### 원인
- OpenAI API 계정의 사용 할당량이 초과되었습니다
- 무료 플랜의 경우 월별 사용량 제한에 도달했을 수 있습니다
- 유료 플랜의 경우 잔액이 부족하거나 월별 한도에 도달했을 수 있습니다

#### 해결 방법

##### 1. **자동 폴백 (즉시 사용 가능)** ✅
현재 시스템은 OpenAI TTS가 실패하면 **자동으로 브라우저 내장 TTS**로 전환됩니다.
- 별도의 조치 없이도 음성 대화를 계속 사용할 수 있습니다
- 브라우저 TTS는 무료이며 할당량 제한이 없습니다
- 음성 품질은 OpenAI TTS보다 다소 낮을 수 있으나, 충분히 사용 가능한 수준입니다

##### 2. **OpenAI API 할당량 늘리기** (선택사항)

OpenAI TTS의 더 나은 음성 품질을 원하시면:

1. **OpenAI 계정 확인**
   - https://platform.openai.com/account/usage 방문
   - 현재 사용량과 한도 확인

2. **결제 방법 추가/업데이트**
   - https://platform.openai.com/account/billing/overview 방문
   - 결제 수단을 추가하거나 업데이트
   - 사용량 한도(Usage limits) 설정 확인

3. **요금제 업그레이드**
   - 무료 플랜: 제한적인 사용량 (월 $5 상당)
   - 종량제(Pay-as-you-go): 사용한 만큼만 지불
   - TTS 비용: 약 $15/1M characters (매우 저렴)

4. **API 키 확인**
   ```bash
   # 현재 API 키가 올바르게 설정되어 있는지 확인
   cat .env | grep OPENAI_API_KEY
   ```

##### 3. **브라우저 TTS 전용 사용**
OpenAI API 비용이 부담되는 경우, 브라우저 TTS만 사용하는 것도 좋은 선택입니다:
- 추가 비용 없음
- 할당량 제한 없음
- Chrome, Safari, Firefox 등 모든 주요 브라우저에서 지원
- 한국어, 영어, 일본어, 중국어 등 다국어 지원

#### 시스템 동작 방식

```
사용자 음성 입력
    ↓
AI 응답 생성 (GPT-4o-mini)
    ↓
TTS 시도
    ├─ OpenAI TTS 시도
    │   ├─ 성공 → OpenAI 음성으로 재생 ✨
    │   └─ 실패 → 브라우저 TTS로 자동 전환 🔄
    └─ 브라우저 TTS로 재생 🔊
```

---

## 🎤 음성 인식 (STT) 문제 해결

### 문제: 음성 인식 네트워크 오류

#### 증상
```
❌ 음성 인식 오류: network
```

#### 해결 방법

1. **인터넷 연결 확인**
   - 안정적인 네트워크 연결 확인
   - Wi-Fi 또는 유선 연결 권장

2. **브라우저 권한 확인**
   - 브라우저에서 마이크 권한이 허용되어 있는지 확인
   - Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 마이크
   - Safari: 환경설정 → 웹사이트 → 마이크

3. **HTTPS 확인**
   - 음성 인식은 HTTPS 환경에서만 작동합니다
   - localhost는 HTTP도 허용됩니다

---

## 🚀 서버 시작 문제

### 문제: 포트가 이미 사용 중

#### 증상
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 해결 방법
```bash
# 3000 포트를 사용하는 프로세스 찾기
lsof -ti:3000

# 프로세스 종료
kill -9 $(lsof -ti:3000)

# 또는 다른 포트 사용
PORT=3001 npm start
```

---

## 📦 의존성 설치 문제

### 문제: npm install 실패

#### 해결 방법
```bash
# 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# Node.js 버전 확인 (권장: 18.x 이상)
node --version
```

---

## 🔐 API 키 설정 문제

### 문제: API 키가 인식되지 않음

#### 해결 방법

1. **.env 파일 위치 확인**
   - 프로젝트 루트 디렉토리에 `.env` 파일이 있어야 합니다
   - `src/` 폴더가 아닌, `package.json`과 같은 위치입니다

2. **.env 파일 형식 확인**
   ```bash
   # 올바른 형식
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-4o-mini
   ```

3. **서버 재시작**
   ```bash
   # .env 파일 수정 후 반드시 서버를 재시작해야 합니다
   npm start
   ```

4. **환경 변수 확인**
   ```bash
   # .env 파일이 제대로 로드되는지 확인
   node -e "require('dotenv').config(); console.log(process.env.OPENAI_API_KEY?.substring(0, 10))"
   ```

---

## 💡 추가 도움말

### 로그 확인
브라우저 개발자 도구(F12)의 콘솔을 확인하면 상세한 오류 메시지를 볼 수 있습니다:
- 🔊 TTS 관련 로그
- 🎤 STT 관련 로그
- 🤖 AI 응답 생성 로그
- ⚠️ 경고 및 오류 메시지

### 서버 로그 확인
터미널에서 서버 실행 시 출력되는 로그를 확인하세요:
```bash
npm start
# 서버 로그에서 오류 메시지 확인
```

### 지원 요청
추가 문제가 발생하면 다음 정보와 함께 문의해주세요:
1. 오류 메시지 (콘솔 로그)
2. 서버 로그
3. 브라우저 및 운영체제 정보
4. 재현 단계

---

## 📝 참고 자료

- [OpenAI API 문서](https://platform.openai.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [실행 가이드](./실행가이드.md)

