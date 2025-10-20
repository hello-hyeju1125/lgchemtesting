import express from 'express';
import realtimeRolePlayingService from '../services/realtimeRolePlayingService.js';
import { validateRolePlayingRequest } from '../middleware/validation.js';
import openaiConfig from '../config/openaiConfig.js';

const router = express.Router();

/**
 * 실시간 롤플레잉 세션 시작 (음성/채팅 선택)
 * POST /api/realtime-role-playing/start-session
 */
router.post('/start-session', validateRolePlayingRequest, async (req, res) => {
  try {
    console.log('🎭 실시간 롤플레잉 세션 시작 요청');
    
    const { teamMemberProfile, scenario, coachingGoals, communicationMode = 'text' } = req.body;
    
    // 통신 모드 검증
    if (!['text', 'voice'].includes(communicationMode)) {
      return res.status(400).json({
        success: false,
        error: '통신 모드는 "text" 또는 "voice"여야 합니다'
      });
    }
    
    const result = await realtimeRolePlayingService.startRealtimeRolePlayingSession({
      teamMemberProfile,
      scenario,
      coachingGoals
    }, communicationMode);
    
    console.log('✅ 실시간 롤플레잉 세션 시작 완료:', result.sessionId);
    
    res.json({
      success: true,
      data: result,
      message: '실시간 롤플레잉 세션이 성공적으로 시작되었습니다'
    });
  } catch (error) {
    console.error('❌ 실시간 롤플레잉 세션 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '실시간 롤플레잉 세션 시작 중 오류가 발생했습니다'
    });
  }
});

/**
 * 실시간 음성 대화 시작
 * POST /api/realtime-role-playing/start-voice-conversation
 */
router.post('/start-voice-conversation', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: '세션 ID가 필요합니다'
      });
    }
    
    console.log('🎤 실시간 음성 대화 시작 요청:', sessionId);
    
    const result = await realtimeRolePlayingService.startRealtimeVoiceConversation(sessionId);
    
    console.log('✅ 실시간 음성 대화 시작 완료:', sessionId);
    
    res.json({
      success: true,
      data: result,
      message: '실시간 음성 대화가 시작되었습니다'
    });
  } catch (error) {
    console.error('❌ 실시간 음성 대화 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '실시간 음성 대화 시작 중 오류가 발생했습니다'
    });
  }
});

/**
 * 실시간 대화 진행 (텍스트 모드)
 * POST /api/realtime-role-playing/process-conversation
 */
router.post('/process-conversation', async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;
    
    if (!sessionId || !userMessage) {
      return res.status(400).json({
        success: false,
        error: '세션 ID와 사용자 메시지가 필요합니다'
      });
    }
    
    console.log('💬 실시간 대화 처리 요청:', sessionId);
    
    const result = await realtimeRolePlayingService.processRealtimeConversation(sessionId, userMessage);
    
    console.log('✅ 실시간 대화 처리 완료:', sessionId);
    
    res.json({
      success: true,
      data: result,
      message: '대화가 성공적으로 처리되었습니다'
    });
  } catch (error) {
    console.error('❌ 실시간 대화 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '대화 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * 세션 상태 조회
 * GET /api/realtime-role-playing/session/:sessionId
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('📊 실시간 롤플레잉 세션 상태 조회:', sessionId);
    
    const session = realtimeRolePlayingService.activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다'
      });
    }
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        communicationMode: session.communicationMode,
        startedAt: session.startedAt,
        sessionMetrics: session.sessionMetrics,
        currentContext: session.currentContext,
        conversationHistory: session.conversationHistory.slice(-5) // 최근 5개만
      },
      message: '세션 상태를 성공적으로 조회했습니다'
    });
  } catch (error) {
    console.error('❌ 세션 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '세션 상태 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * 세션 종료
 * POST /api/realtime-role-playing/end-session
 */
router.post('/end-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: '세션 ID가 필요합니다'
      });
    }
    
    console.log('🏁 실시간 롤플레잉 세션 종료 요청:', sessionId);
    
    const session = realtimeRolePlayingService.endSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다'
      });
    }
    
    console.log('✅ 실시간 롤플레잉 세션 종료 완료:', sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        endedAt: session.endedAt,
        finalFeedback: session.finalFeedback,
        sessionMetrics: session.sessionMetrics,
        conversationSummary: session.finalFeedback.conversationSummary
      },
      message: '세션이 성공적으로 종료되었습니다'
    });
  } catch (error) {
    console.error('❌ 세션 종료 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '세션 종료 중 오류가 발생했습니다'
    });
  }
});

/**
 * 활성 세션 목록 조회
 * GET /api/realtime-role-playing/sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    console.log('📋 활성 실시간 롤플레잉 세션 목록 조회');
    
    const sessions = Array.from(realtimeRolePlayingService.activeSessions.values())
      .map(session => ({
        sessionId: session.id,
        teamMember: session.teamMemberProfile.name,
        scenario: session.scenario.title,
        communicationMode: session.communicationMode,
        status: session.status,
        startedAt: session.startedAt,
        sessionMetrics: session.sessionMetrics
      }));
    
    res.json({
      success: true,
      data: {
        sessions,
        totalCount: sessions.length
      },
      message: '활성 세션 목록을 성공적으로 조회했습니다'
    });
  } catch (error) {
    console.error('❌ 세션 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '세션 목록 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * 실시간 모델 지원 여부 확인
 * GET /api/realtime-role-playing/support-check
 */
router.get('/support-check', async (req, res) => {
  try {
    console.log('🔍 실시간 모델 지원 여부 확인');
    
    const currentModel = openaiConfig.model;
    const modelConfig = openaiConfig.getCurrentModelConfig();
    
    res.json({
      success: true,
      data: {
        currentModel,
        supportsRealtime: modelConfig?.supportsRealtime || false,
        supportsAudio: modelConfig?.supportsAudio || false,
        availableVoices: modelConfig?.supportsRealtime ? 
          ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] : [],
        realtimeConfig: modelConfig?.supportsRealtime ? {
          sample_rate: 24000,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        } : null
      },
      message: '실시간 모델 지원 여부를 확인했습니다'
    });
  } catch (error) {
    console.error('❌ 지원 여부 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '지원 여부 확인 중 오류가 발생했습니다'
    });
  }
});

export default router;
