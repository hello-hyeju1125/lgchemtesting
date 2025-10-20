import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import openaiConfig from '../config/openaiConfig.js';

const router = express.Router();

// multer 설정 (메모리 저장)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

/**
 * 실시간 채팅 스트리밍 API
 */
router.post('/chat-stream', async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    // OpenAI 클라이언트 생성
    const openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      baseURL: openaiConfig.baseURL
    });

    // 대화 히스토리 구성
    const messages = [
      {
        role: 'system',
        content: '당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 간결하고 자연스럽게 대답해주세요.'
      },
      ...conversation.slice(-8).map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('🤖 실시간 채팅 요청:', {
      messageCount: messages.length,
      lastMessage: message
    });

    // OpenAI 스트리밍 요청
    const stream = await openai.chat.completions.create({
      model: openaiConfig.model,
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      stream: true,
    });

    // 스트리밍 응답 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          res.write(data);
        }
      }
      
      // 스트림 종료 신호
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('스트리밍 오류:', error);
      res.status(500).json({ error: '스트리밍 중 오류가 발생했습니다.' });
    }

  } catch (error) {
    console.error('실시간 채팅 API 오류:', error);
    res.status(500).json({ error: 'AI 응답 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * OpenAI TTS API
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다.' });
    }

    // API 키 검증
    if (!openaiConfig.apiKey || openaiConfig.apiKey === 'undefined') {
      console.error('❌ OpenAI API 키가 설정되지 않았습니다');
      return res.status(500).json({ 
        error: 'OpenAI API 키가 설정되지 않았습니다.',
        details: 'OPENAI_API_KEY 환경 변수를 확인해주세요.'
      });
    }

    // OpenAI 클라이언트 생성
    const openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      baseURL: openaiConfig.baseURL
    });

    console.log('🔊 OpenAI TTS 요청:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      voice,
      speed,
      apiKeyPrefix: openaiConfig.apiKey.substring(0, 10) + '...'
    });

    // OpenAI TTS API 호출
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: speed,
    });

    // ArrayBuffer를 Buffer로 변환
    const buffer = Buffer.from(await mp3.arrayBuffer());

    console.log('✅ OpenAI TTS 생성 완료:', {
      bufferSize: buffer.length,
      voice,
      speed
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);

  } catch (error) {
    console.error('❌ TTS API 오류 상세:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: 'TTS 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

/**
 * Whisper STT API (Whale 브라우저용)
 */
router.post('/stt', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    const { modelId, language = 'ko' } = req.body;

    if (!file || !modelId) {
      return res.status(400).json({ 
        error: '오디오 파일과 모델 ID가 필요합니다.' 
      });
    }

    // OpenAI Whisper만 처리 (실시간 음성 대화용)
    if (modelId !== 'openai-whisper') {
      return res.status(400).json({ 
        error: '실시간 음성 대화는 OpenAI Whisper만 지원합니다.' 
      });
    }

    // 파일 크기 검증 (10MB 제한 - 실시간용)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        error: '파일 크기가 10MB를 초과합니다.' 
      });
    }

    console.log('🎤 Whisper STT 처리:', {
      fileName: file.originalname,
      fileSize: file.size,
      language
    });

    // OpenAI 클라이언트 생성
    const openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      baseURL: openaiConfig.baseURL
    });

    // 파일을 OpenAI 형식으로 변환
    const audioFile = new File([file.buffer], file.originalname, {
      type: file.mimetype
    });

    // OpenAI Whisper API 호출
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language === 'ko' ? 'ko' : 'en',
      response_format: 'json',
    });

    console.log('✅ Whisper STT 완료:', transcription.text);

    res.json({
      modelId: 'openai-whisper',
      modelName: 'OpenAI Whisper',
      text: transcription.text,
      transcript: transcription.text, // 호환성을 위해 추가
      confidence: 0.95, // Whisper는 confidence 점수를 제공하지 않으므로 기본값
      language,
      timestamp: new Date().toISOString(),
      fileName: file.originalname,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Whisper STT 오류:', error);
    res.status(500).json({ 
      error: 'Whisper STT 처리 중 오류가 발생했습니다.' 
    });
  }
});

/**
 * 음성대화 지원 여부 확인
 */
router.get('/support-check', (req, res) => {
  res.json({
    webSpeechAPI: true, // 브라우저에서 확인
    whisperSTT: true,
    openaiTTS: true,
    streamingChat: true,
    supportedLanguages: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN'],
    supportedVoices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    apiKeyConfigured: openaiConfig.isAPIKeyValid(),
    apiKeyLength: openaiConfig.apiKey ? openaiConfig.apiKey.length : 0
  });
});

/**
 * OpenAI API 테스트 (디버깅용)
 */
router.get('/test-api', async (req, res) => {
  try {
    if (!openaiConfig.isAPIKeyValid()) {
      return res.status(500).json({ 
        error: 'API 키가 설정되지 않았습니다.',
        configured: false
      });
    }

    const openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      baseURL: openaiConfig.baseURL
    });

    // 간단한 채팅 API 테스트
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });

    res.json({
      success: true,
      message: 'OpenAI API 연결 성공',
      testResponse: response.choices[0].message.content,
      apiKeyConfigured: true,
      model: openaiConfig.model
    });
  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      statusCode: error.status,
      apiKeyConfigured: openaiConfig.isAPIKeyValid()
    });
  }
});

export default router;
