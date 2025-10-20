import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import openaiConfig from '../config/openaiConfig.js';

class RealtimeRolePlayingService {
  constructor() {
    this.activeSessions = new Map();
    this.realtimeConnections = new Map();
  }

  getOpenAI(communicationMode = 'text') {
    if (!this.openai && openaiConfig.isAPIKeyValid()) {
      // 음성 모드일 때만 Realtime 모델 사용
      const modelName = communicationMode === 'voice' ? 'gpt-4o-mini-realtime' : openaiConfig.model;
      
      this.openai = new OpenAI({
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.baseURL
      });
      
      // 모델 설정 저장
      this.currentModel = modelName;
    }
    return this.openai;
  }

  /**
   * 실시간 롤플레잉 세션 시작 (음성/채팅 선택)
   * @param {Object} sessionConfig - 세션 설정
   * @param {string} communicationMode - 'voice' 또는 'text'
   * @returns {Object} 세션 정보
   */
  async startRealtimeRolePlayingSession(sessionConfig, communicationMode = 'text') {
    try {
      const sessionId = uuidv4();
      const { teamMemberProfile, scenario, coachingGoals } = sessionConfig;
      
      console.log(`🎭 실시간 롤플레잉 세션 시작: ${sessionId} (${communicationMode} 모드)`);
      
      // 1. 페르소나 생성
      const persona = await this.generatePersona(teamMemberProfile);
      
      // 2. 시나리오 설정
      const scenarioDetails = await this.setupScenario(scenario, persona);
      
      // 3. 세션 초기화
      const session = {
        id: sessionId,
        teamMemberProfile,
        persona,
        scenario: scenarioDetails,
        coachingGoals,
        communicationMode,
        conversationHistory: [],
        currentContext: {
          mood: 'neutral',
          engagement: 'medium',
          stressLevel: 'low',
          topics: []
        },
        coachingSuggestions: [],
        sessionMetrics: {
          questionsAsked: 0,
          empathyScore: 0,
          clarityScore: 0,
          growthOrientationScore: 0,
          overallScore: 0
        },
        startedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        status: 'active',
        realtimeConfig: this.getRealtimeConfig(communicationMode)
      };

      this.activeSessions.set(sessionId, session);
      
      // 4. 초기 응답 생성
      const initialResponse = await this.generateInitialResponse(session);
      session.conversationHistory.push({
        role: 'assistant',
        content: initialResponse,
        timestamp: moment().format('HH:mm:ss')
      });

      console.log(`✅ 실시간 롤플레잉 세션 생성 완료: ${sessionId}`);
      
      return {
        sessionId,
        session,
        initialResponse,
        communicationMode,
        realtimeConfig: session.realtimeConfig
      };
    } catch (error) {
      console.error('❌ 실시간 롤플레잉 세션 시작 실패:', error);
      throw new Error('실시간 롤플레잉 세션 시작에 실패했습니다');
    }
  }

  /**
   * 실시간 음성 대화 시작
   * @param {string} sessionId - 세션 ID
   * @returns {Object} WebSocket 연결 정보
   */
  async startRealtimeVoiceConversation(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('세션을 찾을 수 없습니다');
      }

      // Realtime 모델 지원 여부 확인
      const realtimeModelConfig = openaiConfig.modelConfigs['gpt-4o-mini-realtime'];
      if (!realtimeModelConfig || !realtimeModelConfig.supportsRealtime) {
        throw new Error('GPT-4o-mini Realtime 모델을 사용할 수 없습니다. 음성 대화를 위해서는 Realtime 모델이 필요합니다.');
      }

      console.log(`🎤 실시간 음성 대화 시작: ${sessionId}`);

      // OpenAI Realtime API 연결 설정
      const realtimeConfig = {
        model: 'gpt-4o-mini-realtime',
        voice: 'alloy', // 음성 선택: alloy, echo, fable, onyx, nova, shimmer
        instructions: this.generateRealtimeInstructions(session),
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        sample_rate: 24000,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      };

      return {
        sessionId,
        realtimeConfig,
        websocketUrl: 'wss://api.openai.com/v1/realtime',
        instructions: realtimeConfig.instructions
      };
    } catch (error) {
      console.error('❌ 실시간 음성 대화 시작 실패:', error);
      throw new Error('실시간 음성 대화 시작에 실패했습니다');
    }
  }

  /**
   * 실시간 대화 처리 (텍스트 모드)
   * @param {string} sessionId - 세션 ID
   * @param {string} userMessage - 사용자 메시지
   * @returns {Object} 응답 및 피드백
   */
  async processRealtimeConversation(sessionId, userMessage) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('세션을 찾을 수 없습니다');
      }

      console.log(`💬 실시간 대화 처리: ${sessionId} (${session.communicationMode} 모드)`);
      
      // 1. 사용자 메시지를 대화 히스토리에 추가
      session.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: moment().format('HH:mm:ss')
      });

      // 2. 페르소나 기반 응답 생성
      const personaResponse = await this.generatePersonaResponse(session, userMessage);
      
      // 3. 실시간 코칭 제안 생성
      const coachingSuggestions = await this.generateCoachingSuggestions(session, userMessage);
      
      // 4. 대화 품질 분석
      const conversationAnalysis = await this.analyzeConversationQuality(session, userMessage);
      
      // 5. 세션 메트릭 업데이트
      this.updateSessionMetrics(session, conversationAnalysis);
      
      // 6. 페르소나 응답을 대화 히스토리에 추가
      session.conversationHistory.push({
        role: 'assistant',
        content: personaResponse,
        timestamp: moment().format('HH:mm:ss')
      });

      // 7. 컨텍스트 업데이트
      this.updateSessionContext(session, personaResponse);

      console.log(`✅ 실시간 대화 처리 완료: ${sessionId}`);
      
      return {
        sessionId,
        personaResponse,
        coachingSuggestions,
        conversationAnalysis,
        sessionMetrics: session.sessionMetrics,
        currentContext: session.currentContext,
        communicationMode: session.communicationMode
      };
    } catch (error) {
      console.error('❌ 실시간 대화 처리 실패:', error);
      throw new Error('실시간 대화 처리 중 오류가 발생했습니다');
    }
  }

  /**
   * 실시간 설정 가져오기
   */
  getRealtimeConfig(communicationMode) {
    const baseConfig = {
      model: 'gpt-4o-mini-realtime',
      voice: 'alloy',
      sample_rate: 24000,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16'
    };

    if (communicationMode === 'voice') {
      return {
        ...baseConfig,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [
          {
            type: 'function',
            function: {
              name: 'end_conversation',
              description: '대화를 종료할 때 호출',
              parameters: {
                type: 'object',
                properties: {
                  reason: {
                    type: 'string',
                    description: '대화 종료 이유'
                  }
                }
              }
            }
          }
        ]
      };
    }

    return baseConfig;
  }

  /**
   * 실시간 음성 대화용 지시사항 생성
   */
  generateRealtimeInstructions(session) {
    const { persona, scenario, coachingGoals } = session;
    
    return `당신은 ${persona.basicPersonality} 성격의 팀원입니다.

페르소나 특성:
- 의사소통 스타일: ${persona.communicationStyle.directness}, ${persona.communicationStyle.pace}
- 피드백 선호도: ${persona.feedbackPreference.frequency}, ${persona.feedbackPreference.style}
- 현재 기분: ${persona.currentMood}

시나리오: ${scenario.title}
상황: ${scenario.description}

코칭 목표: ${coachingGoals.join(', ')}

지침:
1. 자연스럽고 진정성 있는 음성으로 대화하세요
2. 팀원의 성격과 현재 상황을 반영한 응답을 하세요
3. 감정적 표현과 억양을 적절히 사용하세요
4. 대화가 자연스럽게 흘러가도록 하세요
5. 필요시 대화를 종료할 수 있습니다

현재 상황에 맞는 자연스러운 응답을 해주세요.`;
  }

  /**
   * 페르소나 생성 (기존 RolePlayingService와 동일)
   */
  async generatePersona(teamMemberProfile) {
    const prompt = `
다음 팀원 프로필을 바탕으로 Issue Navigator용 페르소나를 생성해주세요:

팀원 프로필:
- 이름: ${teamMemberProfile.name}
- 직급: ${teamMemberProfile.position}
- 부서: ${teamMemberProfile.department}
- 성격: ${teamMemberProfile.personality || '정보 없음'}
- 업무 스타일: ${teamMemberProfile.workStyle || '정보 없음'}
- 의사소통 선호도: ${teamMemberProfile.communicationPreference || '정보 없음'}
- 피드백 선호도: ${teamMemberProfile.feedbackPreference || '정보 없음'}
- 스트레스 반응: ${teamMemberProfile.stressResponse || '정보 없음'}
- 동기부여 요인: ${teamMemberProfile.motivationFactors || '정보 없음'}

다음 JSON 형식으로 페르소나를 생성해주세요:
{
  "basicPersonality": "분석형/직관형/감정형/논리형",
  "communicationStyle": {
    "directness": "직접적/간접적",
    "pace": "빠르게/신중하게",
    "detail": "구체적/추상적"
  },
  "feedbackPreference": {
    "frequency": "자주/가끔",
    "style": "구체적/추상적",
    "delivery": "공개/비공개"
  },
  "stressResponse": {
    "behavior": "회피/대면",
    "emotion": "감정적/논리적",
    "recovery": "빠름/느림"
  },
  "motivationFactors": ["인정", "보상", "성장", "안정"],
  "currentMood": "neutral",
  "recentChallenges": ["도전과제1", "도전과제2"],
  "communicationPatterns": {
    "greeting": "인사 패턴",
    "agreement": "동의 표현",
    "disagreement": "반대 표현",
    "confusion": "혼란 표현",
    "satisfaction": "만족 표현"
  }
}
`;

    if (!this.getOpenAI('text')) {
      console.log('OpenAI API 키가 설정되지 않아 기본 페르소나를 사용합니다.');
      return this.getDefaultPersona();
    }

    try {
      const response = await this.getOpenAI('text').chat.completions.create({
        ...openaiConfig.getPersonaGenerationConfig(),
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0].message.content;
      try {
        // JSON 부분만 추출 (첫 번째 { 부터 마지막 } 까지)
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonContent = content.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonContent);
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다');
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.log('원본 응답:', content);
        return this.getDefaultPersona();
      }
    } catch (error) {
      console.error('페르소나 생성 오류:', error);
      return this.getDefaultPersona();
    }
  }

  /**
   * 시나리오 설정 (기존 RolePlayingService와 동일)
   */
  async setupScenario(scenario, persona) {
    const scenarios = {
      'conflict_resolution': {
        title: '갈등 해결 미팅',
        description: '팀 내 갈등 상황을 해결하기 위한 미팅',
        context: '팀원 간 의견 충돌이나 갈등을 해결하고 협력 관계를 회복하는 미팅',
        keyTopics: ['갈등 원인 파악', '상호 이해', '해결 방안', '관계 회복'],
        challenges: ['감정적 상황 관리', '공정한 중재', '지속 가능한 해결책']
      },
      'performance_review': {
        title: '성과 평가 미팅',
        description: '연간 성과 평가를 위한 1:1 미팅 상황',
        context: '팀원의 최근 성과를 평가하고 다음 분기 목표를 설정하는 미팅',
        keyTopics: ['성과 검토', '강점 분석', '개선 영역', '목표 설정'],
        challenges: ['부정적 피드백 전달', '동기부여 유지', '구체적 목표 설정']
      },
      'career_development': {
        title: '커리어 개발 미팅',
        description: '팀원의 장기적 성장과 발전을 논의하는 미팅',
        context: '팀원의 커리어 목표와 성장 계획을 논의하고 지원 방안을 모색하는 미팅',
        keyTopics: ['커리어 목표', '역량 개발', '기회 탐색', '지원 방안'],
        challenges: ['현실적 목표 설정', '자원 제약 고려', '동기 유지']
      },
      'project_feedback': {
        title: '프로젝트 피드백 미팅',
        description: '완료된 프로젝트에 대한 피드백을 제공하는 미팅',
        context: '프로젝트 완료 후 성과를 평가하고 학습 포인트를 도출하는 미팅',
        keyTopics: ['프로젝트 성과', '학습 포인트', '개선 사항', '다음 단계'],
        challenges: ['균형잡힌 피드백', '학습 지향적 접근', '동기부여']
      }
    };

    return scenarios[scenario] || scenarios['conflict_resolution'];
  }

  /**
   * 초기 응답 생성
   */
  async generateInitialResponse(session) {
    const { persona, scenario, communicationMode } = session;
    
    const prompt = `
당신은 ${persona.basicPersonality} 성격의 팀원입니다.

페르소나 특성:
- 의사소통 스타일: ${persona.communicationStyle.directness}, ${persona.communicationStyle.pace}
- 피드백 선호도: ${persona.feedbackPreference.frequency}, ${persona.feedbackPreference.style}
- 현재 기분: ${persona.currentMood}

시나리오: ${scenario.title}
상황: ${scenario.description}
대화 모드: ${communicationMode === 'voice' ? '음성 대화' : '텍스트 채팅'}

이 상황에서 리더가 미팅을 시작할 때 자연스러운 첫 인사와 반응을 생성해주세요.
1-2문장으로 간단하게 응답해주세요.
`;

    if (!this.getOpenAI(communicationMode)) {
      console.log('OpenAI API 키가 설정되지 않아 기본 초기 응답을 사용합니다.');
      return "안녕하세요. 미팅 시간이 되었네요. 어떤 이야기를 나누고 싶으신가요?";
    }

    try {
      const response = await this.getOpenAI(communicationMode).chat.completions.create({
        ...openaiConfig.getInitialResponseConfig(),
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('초기 응답 생성 오류:', error);
      return "안녕하세요. 미팅 시간이 되었네요. 어떤 이야기를 나누고 싶으신가요?";
    }
  }

  /**
   * 페르소나 기반 응답 생성
   */
  async generatePersonaResponse(session, userMessage) {
    const { persona, conversationHistory, currentContext, communicationMode } = session;
    
    const prompt = `
당신은 ${persona.basicPersonality} 성격의 팀원입니다.

페르소나 특성:
- 의사소통 스타일: ${persona.communicationStyle.directness}, ${persona.communicationStyle.pace}, ${persona.communicationStyle.detail}
- 피드백 선호도: ${persona.feedbackPreference.frequency}, ${persona.feedbackPreference.style}
- 스트레스 반응: ${persona.stressResponse.behavior}, ${persona.stressResponse.emotion}
- 현재 기분: ${currentContext.mood}
- 참여도: ${currentContext.engagement}
- 대화 모드: ${communicationMode === 'voice' ? '음성 대화' : '텍스트 채팅'}

최근 대화 맥락:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

리더의 메시지: "${userMessage}"

위 맥락을 바탕으로 페르소나에 맞는 자연스러운 응답을 생성해주세요. 
응답은 1-3문장으로 구성하고, 팀원의 성격과 현재 상황을 반영해야 합니다.
${communicationMode === 'voice' ? '음성 대화에 적합한 자연스러운 표현을 사용하세요.' : ''}
`;

    if (!this.getOpenAI(communicationMode)) {
      console.log('OpenAI API 키가 설정되지 않아 기본 응답을 사용합니다.');
      return "네, 이해했습니다. 말씀해주세요.";
    }

    try {
      const response = await this.getOpenAI(communicationMode).chat.completions.create({
        ...openaiConfig.getConversationConfig(),
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('페르소나 응답 생성 오류:', error);
      return "네, 이해했습니다. 말씀해주세요.";
    }
  }

  /**
   * 실시간 코칭 제안 생성
   */
  async generateCoachingSuggestions(session, userMessage) {
    const prompt = `
다음 상황에서 리더에게 제공할 코칭 제안을 생성해주세요:

현재 상황:
- 팀원 페르소나: ${JSON.stringify(session.persona, null, 2)}
- 리더 메시지: "${userMessage}"
- 현재 컨텍스트: ${JSON.stringify(session.currentContext, null, 2)}
- 코칭 목표: ${session.coachingGoals.join(', ')}
- 대화 모드: ${session.communicationMode}

다음 카테고리별로 제안을 제공해주세요:
1. 즉시 적용 가능한 코칭 기법
2. 다음 질문 제안
3. 주의사항
4. 격려 방법

JSON 형식으로 제공해주세요:
{
  "immediateTechniques": ["기법1", "기법2"],
  "nextQuestions": ["질문1", "질문2"],
  "cautions": ["주의사항1", "주의사항2"],
  "encouragementMethods": ["방법1", "방법2"]
}
`;

    if (!this.getOpenAI('text')) {
      console.log('OpenAI API 키가 설정되지 않아 기본 코칭 제안을 사용합니다.');
      return this.getDefaultCoachingSuggestions();
    }

    try {
      const response = await this.getOpenAI('text').chat.completions.create({
        ...openaiConfig.getCoachingSuggestionsConfig(),
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0].message.content;
      try {
        // JSON 부분만 추출 (첫 번째 { 부터 마지막 } 까지)
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonContent = content.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonContent);
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다');
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.log('원본 응답:', content);
        return this.getDefaultCoachingSuggestions();
      }
    } catch (error) {
      console.error('코칭 제안 생성 오류:', error);
      return this.getDefaultCoachingSuggestions();
    }
  }

  /**
   * 대화 품질 분석 (기존 RolePlayingService와 동일)
   */
  async analyzeConversationQuality(session, userMessage) {
    const analysis = {
      questionAppropriateness: this.analyzeQuestionAppropriateness(userMessage),
      listeningDepth: this.analyzeListeningDepth(session.conversationHistory),
      empathyExpression: this.analyzeEmpathyExpression(userMessage),
      clarityLevel: this.analyzeClarityLevel(userMessage),
      growthOrientation: this.analyzeGrowthOrientation(userMessage)
    };

    return analysis;
  }

  // 대화 품질 분석 메서드들 (기존 RolePlayingService와 동일)
  analyzeQuestionAppropriateness(message) {
    const questionWords = ['어떻게', '왜', '무엇', '언제', '어디서', '누구'];
    const hasQuestion = questionWords.some(word => message.includes(word));
    const isOpenEnded = message.includes('?') && !message.includes('예/아니오');
    
    let score = 3; // 기본 점수
    if (hasQuestion) score += 1;
    if (isOpenEnded) score += 1;
    if (message.length > 20) score += 1; // 충분한 맥락 제공
    
    return Math.min(5, Math.max(1, score));
  }

  analyzeListeningDepth(conversationHistory) {
    const recentMessages = conversationHistory.slice(-4);
    const userMessages = recentMessages.filter(msg => msg.role === 'user');
    
    let score = 3; // 기본 점수
    if (userMessages.length >= 2) score += 1; // 지속적인 참여
    if (userMessages.some(msg => msg.content.includes('듣고'))) score += 1; // 경청 표현
    
    return Math.min(5, Math.max(1, score));
  }

  analyzeEmpathyExpression(message) {
    const empathyWords = ['이해', '공감', '느끼', '어려움', '힘들', '도움', '지원'];
    const hasEmpathy = empathyWords.some(word => message.includes(word));
    
    let score = 3; // 기본 점수
    if (hasEmpathy) score += 2;
    
    return Math.min(5, Math.max(1, score));
  }

  analyzeClarityLevel(message) {
    let score = 3; // 기본 점수
    if (message.length > 30) score += 1; // 충분한 설명
    if (!message.includes('?')) score += 1; // 명확한 의사 표현
    
    return Math.min(5, Math.max(1, score));
  }

  analyzeGrowthOrientation(message) {
    const growthWords = ['성장', '발전', '개선', '학습', '목표', '계획', '미래'];
    const hasGrowthWords = growthWords.some(word => message.includes(word));
    
    let score = 3; // 기본 점수
    if (hasGrowthWords) score += 2;
    
    return Math.min(5, Math.max(1, score));
  }

  /**
   * 세션 메트릭 업데이트 (기존 RolePlayingService와 동일)
   */
  updateSessionMetrics(session, analysis) {
    const weights = {
      questionAppropriateness: 0.25,
      listeningDepth: 0.2,
      empathyExpression: 0.2,
      clarityLevel: 0.2,
      growthOrientation: 0.15
    };

    // 개별 점수 업데이트
    session.sessionMetrics.questionsAsked += 1;
    session.sessionMetrics.empathyScore = analysis.empathyExpression;
    session.sessionMetrics.clarityScore = analysis.clarityLevel;
    session.sessionMetrics.growthOrientationScore = analysis.growthOrientation;

    // 전체 점수 계산
    const overallScore = Object.keys(weights).reduce((sum, key) => {
      return sum + (analysis[key] * weights[key]);
    }, 0);

    session.sessionMetrics.overallScore = Math.round(overallScore * 10) / 10;
  }

  /**
   * 세션 컨텍스트 업데이트 (기존 RolePlayingService와 동일)
   */
  updateSessionContext(session, personaResponse) {
    // 간단한 감정 분석을 통한 기분 업데이트
    const positiveWords = ['좋', '만족', '기쁘', '감사', '고마'];
    const negativeWords = ['어려', '힘들', '부담', '걱정', '불안'];
    
    const hasPositive = positiveWords.some(word => personaResponse.includes(word));
    const hasNegative = negativeWords.some(word => personaResponse.includes(word));
    
    if (hasPositive && !hasNegative) {
      session.currentContext.mood = 'positive';
    } else if (hasNegative && !hasPositive) {
      session.currentContext.mood = 'negative';
    } else {
      session.currentContext.mood = 'neutral';
    }
  }

  /**
   * 세션 종료
   */
  endSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endedAt = moment().format('YYYY-MM-DD HH:mm:ss');
      
      // 최종 피드백 생성
      const finalFeedback = this.generateFinalFeedback(session);
      session.finalFeedback = finalFeedback;
      
      console.log(`🏁 실시간 롤플레잉 세션 종료: ${sessionId}`);
      return session;
    }
    return null;
  }

  /**
   * 최종 피드백 생성 (기존 RolePlayingService와 동일)
   */
  generateFinalFeedback(session) {
    const { sessionMetrics, conversationHistory } = session;
    
    return {
      overallScore: sessionMetrics.overallScore,
      strengths: this.identifyStrengths(sessionMetrics),
      improvements: this.identifyImprovements(sessionMetrics),
      recommendations: this.generateRecommendations(sessionMetrics),
      conversationSummary: this.summarizeConversation(conversationHistory)
    };
  }

  identifyStrengths(metrics) {
    const strengths = [];
    if (metrics.empathyScore >= 4) strengths.push('공감 능력');
    if (metrics.clarityScore >= 4) strengths.push('명확한 의사소통');
    if (metrics.growthOrientationScore >= 4) strengths.push('성장 지향적 접근');
    return strengths;
  }

  identifyImprovements(metrics) {
    const improvements = [];
    if (metrics.empathyScore < 3) improvements.push('공감 표현 강화');
    if (metrics.clarityScore < 3) improvements.push('의사소통 명확성 향상');
    if (metrics.growthOrientationScore < 3) improvements.push('성장 지향적 질문 활용');
    return improvements;
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    if (metrics.overallScore < 3) {
      recommendations.push('전반적인 코칭 스킬 향상이 필요합니다');
    }
    if (metrics.empathyScore < 3) {
      recommendations.push('팀원의 감정을 더 잘 이해하고 공감하는 연습이 필요합니다');
    }
    return recommendations;
  }

  summarizeConversation(conversationHistory) {
    return `총 ${conversationHistory.length}번의 대화가 진행되었습니다.`;
  }

  // 기본값 제공 메서드들 (기존 RolePlayingService와 동일)
  getDefaultPersona() {
    return {
      basicPersonality: "분석형",
      communicationStyle: {
        directness: "직접적",
        pace: "신중하게",
        detail: "구체적"
      },
      feedbackPreference: {
        frequency: "가끔",
        style: "구체적",
        delivery: "비공개"
      },
      stressResponse: {
        behavior: "대면",
        emotion: "논리적",
        recovery: "보통"
      },
      motivationFactors: ["성장", "인정"],
      currentMood: "neutral",
      recentChallenges: ["업무 우선순위", "시간 관리"],
      communicationPatterns: {
        greeting: "안녕하세요",
        agreement: "네, 맞습니다",
        disagreement: "다른 의견이 있습니다",
        confusion: "잘 모르겠습니다",
        satisfaction: "만족합니다"
      }
    };
  }

  getDefaultCoachingSuggestions() {
    return {
      immediateTechniques: ["적극적 경청", "공감 표현"],
      nextQuestions: ["어떻게 생각하시나요?", "더 자세히 말씀해주세요"],
      cautions: ["감정적 반응 주의", "성급한 판단 금지"],
      encouragementMethods: ["구체적 칭찬", "지속적 관심 표현"]
    };
  }
}

export default new RealtimeRolePlayingService();
