import express from 'express';
import rolePlayingService from '../services/rolePlayingService.js';
import { validateRolePlayingRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * Issue Navigator 세션 시작
 * POST /api/role-playing/start-session
 */
router.post('/start-session', validateRolePlayingRequest, async (req, res) => {
  try {
    console.log('🎭 롤플레잉 세션 시작 요청');
    
    const { teamMemberProfile, scenario, coachingGoals } = req.body;
    const result = await rolePlayingService.startRolePlayingSession({
      teamMemberProfile,
      scenario,
      coachingGoals
    });
    
    console.log('✅ 롤플레잉 세션 시작 완료:', result.sessionId);
    
    res.json({
      success: true,
      data: result,
      message: '롤플레잉 세션이 성공적으로 시작되었습니다'
    });
  } catch (error) {
    console.error('❌ 롤플레잉 세션 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '롤플레잉 세션 시작 중 오류가 발생했습니다'
    });
  }
});

/**
 * Issue Navigator 챗봇 대화
 * POST /api/role-playing/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, issueContext, chatHistory, isInitialAnalysis } = req.body;
    
    if (!issueContext) {
      return res.status(400).json({
        success: false,
        error: '이슈 컨텍스트가 필요합니다'
      });
    }

    console.log('💬 Issue Navigator 대화 요청:', isInitialAnalysis ? '초기 분석' : message);
    
    const response = await rolePlayingService.processIssueNavigatorChat({
      message,
      issueContext,
      chatHistory,
      isInitialAnalysis
    });
    
    console.log('✅ AI 응답 생성 완료');
    
    res.json({
      success: true,
      response: response,
      message: '대화가 성공적으로 처리되었습니다'
    });
  } catch (error) {
    console.error('❌ 대화 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '대화 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * 대화 진행
 * POST /api/role-playing/conversation
 */
router.post('/conversation', async (req, res) => {
  try {
    const { sessionId, userMessage } = req.body;
    
    if (!sessionId || !userMessage) {
      return res.status(400).json({
        success: false,
        error: '세션 ID와 사용자 메시지가 필요합니다'
      });
    }

    console.log(`💬 대화 진행: ${sessionId}`);
    
    const result = await rolePlayingService.processConversation(sessionId, userMessage);
    
    console.log('✅ 대화 처리 완료:', sessionId);
    
    res.json({
      success: true,
      data: result,
      message: '대화가 성공적으로 처리되었습니다'
    });
  } catch (error) {
    console.error('❌ 대화 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '대화 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * 세션 종료
 * POST /api/role-playing/end-session
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

    console.log(`🏁 세션 종료: ${sessionId}`);
    
    const session = rolePlayingService.endSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다'
      });
    }

    console.log('✅ 세션 종료 완료:', sessionId);
    
    res.json({
      success: true,
      data: session,
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
 * 활성 세션 조회
 * GET /api/role-playing/active-sessions
 */
router.get('/active-sessions', (req, res) => {
  try {
    const activeSessions = Array.from(rolePlayingService.activeSessions.values())
      .filter(session => session.status === 'active')
      .map(session => ({
        id: session.id,
        teamMember: session.teamMemberProfile.name,
        scenario: session.scenario.title,
        startedAt: session.startedAt,
        conversationCount: session.conversationHistory.length,
        overallScore: session.sessionMetrics.overallScore
      }));

    res.json({
      success: true,
      data: activeSessions,
      message: '활성 세션 목록을 조회했습니다'
    });
  } catch (error) {
    console.error('❌ 활성 세션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '활성 세션 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * 세션 상세 정보 조회
 * GET /api/role-playing/session/:sessionId
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = rolePlayingService.activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: session,
      message: '세션 정보를 조회했습니다'
    });
  } catch (error) {
    console.error('❌ 세션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '세션 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * 시나리오 템플릿 조회
 * GET /api/role-playing/scenarios
 */
router.get('/scenarios', (req, res) => {
  const scenarios = {
    'performance_review': {
      title: '성과 평가 미팅',
      description: '연간 성과 평가를 위한 1:1 미팅 상황',
      difficulty: 'medium',
      duration: '30-45분',
      keySkills: ['피드백 제공', '목표 설정', '동기부여']
    },
    'conflict_resolution': {
      title: '갈등 해결 미팅',
      description: '팀 내 갈등 상황을 해결하기 위한 미팅',
      difficulty: 'high',
      duration: '45-60분',
      keySkills: ['갈등 해결', '중재', '감정 관리']
    },
    'career_development': {
      title: '커리어 개발 미팅',
      description: '팀원의 장기적 성장과 발전을 논의하는 미팅',
      difficulty: 'medium',
      duration: '30-45분',
      keySkills: ['커리어 상담', '목표 설정', '지원 방안']
    },
    'project_feedback': {
      title: '프로젝트 피드백 미팅',
      description: '완료된 프로젝트에 대한 피드백을 제공하는 미팅',
      difficulty: 'low',
      duration: '20-30분',
      keySkills: ['피드백 제공', '학습 촉진', '성과 인정']
    }
  };

  res.json({
    success: true,
    data: scenarios,
    message: '시나리오 템플릿을 조회했습니다'
  });
});

/**
 * 페르소나 템플릿 조회
 * GET /api/role-playing/persona-templates
 */
router.get('/persona-templates', (req, res) => {
  const personaTemplates = {
    'analytical': {
      name: '분석형 팀원',
      description: '논리적이고 체계적인 사고를 하는 팀원',
      characteristics: ['데이터 기반 의사결정', '신중한 접근', '구체적 정보 선호'],
      communicationStyle: '직접적이고 구체적',
      stressResponse: '논리적 분석을 통한 해결',
      motivationFactors: ['성장', '도전', '인정']
    },
    'intuitive': {
      name: '직관형 팀원',
      description: '창의적이고 유연한 사고를 하는 팀원',
      characteristics: ['큰 그림 중시', '유연한 접근', '새로운 아이디어 선호'],
      communicationStyle: '간접적이고 추상적',
      stressResponse: '창의적 해결책 모색',
      motivationFactors: ['자유', '창의성', '의미']
    },
    'emotional': {
      name: '감정형 팀원',
      description: '감정적이고 관계 중심적인 팀원',
      characteristics: ['팀워크 중시', '감정적 소통', '인간관계 선호'],
      communicationStyle: '공감적이고 따뜻함',
      stressResponse: '감정적 지지 필요',
      motivationFactors: ['인정', '관계', '안정']
    },
    'logical': {
      name: '논리형 팀원',
      description: '체계적이고 효율성을 중시하는 팀원',
      characteristics: ['과정 중시', '효율성 추구', '규칙 준수'],
      communicationStyle: '명확하고 체계적',
      stressResponse: '체계적 해결책 모색',
      motivationFactors: ['효율성', '성과', '질서']
    }
  };

  res.json({
    success: true,
    data: personaTemplates,
    message: '페르소나 템플릿을 조회했습니다'
  });
});

/**
 * 코칭 기법 가이드 조회
 * GET /api/role-playing/coaching-techniques
 */
router.get('/coaching-techniques', (req, res) => {
  const techniques = {
    'grow_model': {
      name: 'GROW 모델',
      description: '목표(Goal), 현실(Reality), 옵션(Options), 의지(Will)를 활용한 코칭',
      steps: [
        '목표 설정: 무엇을 달성하고 싶은가?',
        '현실 파악: 현재 상황은 어떤가?',
        '옵션 탐색: 어떤 방법들이 있는가?',
        '의지 확인: 무엇을 할 것인가?'
      ],
      whenToUse: '구체적인 목표 달성을 위한 코칭'
    },
    'star_method': {
      name: 'STAR 방법',
      description: '상황(Situation), 과제(Task), 행동(Action), 결과(Result)를 활용한 피드백',
      steps: [
        '상황 설명: 어떤 상황이었는가?',
        '과제 명시: 무엇을 해야 했는가?',
        '행동 분석: 어떻게 행동했는가?',
        '결과 평가: 어떤 결과가 있었는가?'
      ],
      whenToUse: '성과나 행동에 대한 구체적 피드백'
    },
    'smart_goals': {
      name: 'SMART 목표 설정',
      description: '구체적(Specific), 측정가능(Measurable), 달성가능(Achievable), 관련성(Relevant), 시간제한(Time-bound) 목표',
      steps: [
        '구체적: 무엇을 정확히 달성할 것인가?',
        '측정가능: 어떻게 측정할 것인가?',
        '달성가능: 현실적으로 달성 가능한가?',
        '관련성: 목표가 의미 있는가?',
        '시간제한: 언제까지 달성할 것인가?'
      ],
      whenToUse: '목표 설정 및 계획 수립'
    }
  };

  res.json({
    success: true,
    data: techniques,
    message: '코칭 기법 가이드를 조회했습니다'
  });
});

export default router;
