import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 라우터 임포트
import meetingPrepRouter from './routes/meetingPrep.js';
import insightReportRouter from './routes/insightReport.js';
import rolePlayingRouter from './routes/rolePlaying.js';
import realtimeRolePlayingRouter from './routes/realtimeRolePlaying.js';
import voiceChatRouter from './routes/voiceChat.js'; // 음성대화 라우트 추가
import teamStatusRouter from './routes/teamStatus.js'; // 팀 현황 라우트 추가

// 미들웨어 임포트
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// OpenAI 설정 임포트
import openaiConfig from './config/openaiConfig.js';

dotenv.config({ path: './.env' });

// 환경 변수 디버깅
console.log('🔧 환경 변수 확인:');
console.log('OPENAI_API_KEY 길이:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_API_KEY 시작:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'undefined');
console.log('PORT:', process.env.PORT || 3000);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('현재 작업 디렉토리:', process.cwd());
console.log('.env 파일 존재 여부:', fs.existsSync('.env'));

// OpenAI 설정 정보 표시
console.log('🤖 OpenAI 설정 정보:');
const configInfo = openaiConfig.getConfigInfo();
console.log('모델:', configInfo.model);
console.log('API 키 길이:', configInfo.apiKeyLength);
console.log('API 키 시작:', configInfo.apiKeyPrefix);
console.log('Base URL:', configInfo.baseURL);
console.log('모델 설명:', configInfo.currentModelConfig.description);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors());

// 기본 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../public')));

// API 라우트
app.use('/api/meeting-prep', meetingPrepRouter);
app.use('/api/insight-report', insightReportRouter);
app.use('/api/role-playing', rolePlayingRouter);
app.use('/api/realtime-role-playing', realtimeRolePlayingRouter);
app.use('/api/voice-chat', voiceChatRouter); // 음성대화 라우트 추가
app.use('/api/team-status', teamStatusRouter); // 팀 현황 라우트 추가

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl 
  });
});

// 에러 핸들러
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 코칭피드백 AI 시스템이 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📊 대시보드: http://localhost:${PORT}`);
  console.log(`🔍 헬스 체크: http://localhost:${PORT}/health`);
});

export default app;
