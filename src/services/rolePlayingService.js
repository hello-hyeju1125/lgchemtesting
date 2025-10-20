import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import openaiConfig from '../config/openaiConfig.js';

class RolePlayingService {
  constructor() {
    this.activeSessions = new Map(); // 활성 세션 관리
  }

  getOpenAI() {
    if (!this.openai && openaiConfig.isAPIKeyValid()) {
      this.openai = new OpenAI({
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.baseURL
      });
    }
    return this.openai;
  }

  /**
   * Issue Navigator 세션 시작
   * @param {Object} sessionConfig - 세션 설정
   * @returns {Object} 세션 정보
   */
  async startRolePlayingSession(sessionConfig) {
    try {
      const sessionId = uuidv4();
      const { teamMemberProfile, scenario, coachingGoals } = sessionConfig;
      
      console.log(`🎭 롤플레잉 세션 시작: ${sessionId}`);
      
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
        status: 'active'
      };

      this.activeSessions.set(sessionId, session);
      
      // 4. 초기 응답 생성
      const initialResponse = await this.generateInitialResponse(session);
      session.conversationHistory.push({
        role: 'assistant',
        content: initialResponse,
        timestamp: moment().format('HH:mm:ss')
      });

      console.log(`✅ 롤플레잉 세션 생성 완료: ${sessionId}`);
      
      return {
        sessionId,
        session,
        initialResponse
      };
    } catch (error) {
      console.error('❌ 롤플레잉 세션 시작 실패:', error);
      throw new Error('롤플레잉 세션 시작에 실패했습니다');
    }
  }

  /**
   * 대화 진행
   * @param {string} sessionId - 세션 ID
   * @param {string} userMessage - 사용자 메시지
   * @returns {Object} 응답 및 피드백
   */
  async processConversation(sessionId, userMessage) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('세션을 찾을 수 없습니다');
      }

      console.log(`💬 대화 처리: ${sessionId}`);
      
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

      console.log(`✅ 대화 처리 완료: ${sessionId}`);
      
      return {
        sessionId,
        personaResponse,
        coachingSuggestions,
        conversationAnalysis,
        sessionMetrics: session.sessionMetrics,
        currentContext: session.currentContext
      };
    } catch (error) {
      console.error('❌ 대화 처리 실패:', error);
      throw new Error('대화 처리 중 오류가 발생했습니다');
    }
  }

  /**
   * 초기 응답 생성
   */
  async generateInitialResponse(session) {
    const { persona, scenario } = session;
    
    const prompt = `
당신은 ${persona.basicPersonality} 성격의 팀원입니다.

페르소나 특성:
- 의사소통 스타일: ${persona.communicationStyle.directness}, ${persona.communicationStyle.pace}
- 피드백 선호도: ${persona.feedbackPreference.frequency}, ${persona.feedbackPreference.style}
- 현재 기분: ${persona.currentMood}

시나리오: ${scenario.title}
상황: ${scenario.description}

이 상황에서 리더가 미팅을 시작할 때 자연스러운 첫 인사와 반응을 생성해주세요.
1-2문장으로 간단하게 응답해주세요.
`;

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 초기 응답을 사용합니다.');
      return "안녕하세요. 미팅 시간이 되었네요. 어떤 이야기를 나누고 싶으신가요?";
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
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
   * 페르소나 생성
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

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 페르소나를 사용합니다.');
      return this.getDefaultPersona();
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
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
   * 시나리오 설정
   */
  async setupScenario(scenario, persona) {
    const scenarios = {
      'performance_review': {
        title: '성과 평가 미팅',
        description: '연간 성과 평가를 위한 1:1 미팅 상황',
        context: '팀원의 최근 성과를 평가하고 다음 분기 목표를 설정하는 미팅',
        keyTopics: ['성과 검토', '강점 분석', '개선 영역', '목표 설정'],
        challenges: ['부정적 피드백 전달', '동기부여 유지', '구체적 목표 설정']
      },
      'conflict_resolution': {
        title: '갈등 해결 미팅',
        description: '팀 내 갈등 상황을 해결하기 위한 미팅',
        context: '팀원 간 의견 충돌이나 갈등을 해결하고 협력 관계를 회복하는 미팅',
        keyTopics: ['갈등 원인 파악', '상호 이해', '해결 방안', '관계 회복'],
        challenges: ['감정적 상황 관리', '공정한 중재', '지속 가능한 해결책']
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

    return scenarios[scenario] || scenarios['performance_review'];
  }

  /**
   * 페르소나 기반 응답 생성
   */
  async generatePersonaResponse(session, userMessage) {
    const { persona, conversationHistory, currentContext } = session;
    
    const prompt = `
당신은 ${persona.basicPersonality} 성격의 팀원입니다.

페르소나 특성:
- 의사소통 스타일: ${persona.communicationStyle.directness}, ${persona.communicationStyle.pace}, ${persona.communicationStyle.detail}
- 피드백 선호도: ${persona.feedbackPreference.frequency}, ${persona.feedbackPreference.style}
- 스트레스 반응: ${persona.stressResponse.behavior}, ${persona.stressResponse.emotion}
- 현재 기분: ${currentContext.mood}
- 참여도: ${currentContext.engagement}

최근 대화 맥락:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

리더의 메시지: "${userMessage}"

위 맥락을 바탕으로 페르소나에 맞는 자연스러운 응답을 생성해주세요. 
응답은 1-3문장으로 구성하고, 팀원의 성격과 현재 상황을 반영해야 합니다.
`;

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 응답을 사용합니다.');
      return "네, 이해했습니다. 말씀해주세요.";
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
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

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 코칭 제안을 사용합니다.');
      return this.getDefaultCoachingSuggestions();
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
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
   * 대화 품질 분석
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

  // 대화 품질 분석 메서드들
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
   * 세션 메트릭 업데이트
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
   * 세션 컨텍스트 업데이트
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
      
      console.log(`🏁 롤플레잉 세션 종료: ${sessionId}`);
      return session;
    }
    return null;
  }

  /**
   * 최종 피드백 생성
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

  // 기본값 제공 메서드들
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

  /**
   * Issue Navigator 챗봇 대화 처리
   * @param {Object} chatData - 대화 데이터
   * @returns {String} AI 응답
   */
  async processIssueNavigatorChat({ message, issueContext, chatHistory, isInitialAnalysis }) {
    try {
      const openai = this.getOpenAI();
      
      if (!openai) {
        throw new Error('OpenAI API가 설정되지 않았습니다');
      }

      console.log('🤖 Issue Navigator AI 응답 생성 중...');

      // 시스템 프롬프트 구성
      const systemPrompt = this.buildIssueNavigatorSystemPrompt(issueContext);
      
      let messages = [];
      
      // 초기 분석 요청인 경우
      if (isInitialAnalysis) {
        const initialPrompt = this.buildInitialAnalysisPrompt(issueContext);
        messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: initialPrompt }
        ];
      } else {
        // 일반 대화인 경우
        messages = [
          { role: 'system', content: systemPrompt },
          ...chatHistory.slice(-10), // 최근 10개 대화만 유지
          { role: 'user', content: message }
        ];
      }

      // OpenAI API 호출
      const response = await openai.chat.completions.create({
        model: openaiConfig.model || 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = response.choices[0].message.content;
      console.log('✅ AI 응답 생성 완료');

      return aiResponse;

    } catch (error) {
      console.error('❌ Issue Navigator 대화 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 초기 분석 프롬프트 생성
   * @param {Object} issueContext - 이슈 컨텍스트
   * @returns {String} 초기 분석 프롬프트
   */
  buildInitialAnalysisPrompt(issueContext) {
    // 데이터가 있는지 확인
    const hasData = issueContext.situationSummary || 
                   issueContext.occurrenceTime || 
                   issueContext.recentFeedback || 
                   issueContext.stakeholderInfo || 
                   issueContext.hiddenNeeds ||
                   issueContext.leaderCauseView ||
                   issueContext.leaderSolutionDirection ||
                   (issueContext.emotionReaction && issueContext.emotionReaction.length > 0) ||
                   (issueContext.leaderSupport && issueContext.leaderSupport.length > 0);

    if (!hasData) {
      // 데이터가 없을 때
      return `리더가 구체적인 이슈 정보를 입력하지 않았습니다. 
간단한 인사와 함께, 어떤 팀 이슈나 고민이 있는지 물어보는 친근한 첫 메시지를 작성해주세요.

형식: "안녕하세요! Issue Navigator입니다. [질문 또는 도움 제안]"

자연스럽고 따뜻한 톤으로 작성해주세요.`;
    }

    // 데이터가 있을 때
    return `리더가 입력한 팀 이슈 정보를 분석하여, 첫 인사 메시지를 작성해주세요.

다음 형식을 따라주세요:
"안녕하세요! Issue Navigator입니다. 입력하신 팀 이슈 상황을 분석했습니다. 제가 생각하는 문제의 원인은 [입력된 정보를 바탕으로 한 구체적인 원인 분석 2-3문장]입니다. 리더님은 어떻게 생각하시나요?"

요구사항:
1. 입력된 이슈 정보를 면밀히 분석하여 근본 원인을 파악하세요
2. 표면적 문제가 아닌, 구조적/감정적/관계적 측면을 고려하세요
3. 구체적이고 통찰력 있는 분석을 제공하세요
4. 2-3문장으로 간결하게 작성하세요
5. 리더의 의견을 묻는 질문으로 마무리하세요

입력된 정보:
- 상황: ${issueContext.situationSummary || '없음'}
- 발생 시기: ${issueContext.occurrenceTime || '없음'}
- 영향도: ${issueContext.impactLevel || '없음'}/5
- 감정 반응: ${issueContext.emotionReaction?.join(', ') || '없음'}
- 관련 피드백: ${issueContext.recentFeedback || '없음'}
- 이해관계자 정보: ${issueContext.stakeholderInfo || '없음'}
- 숨은 니즈: ${issueContext.hiddenNeeds || '없음'}
- 리더가 보는 원인: ${issueContext.leaderCauseView || '없음'}
- 해결 방향: ${issueContext.leaderSolutionDirection || '없음'}`;
  }

  /**
   * Issue Navigator 시스템 프롬프트 구성
   * @param {Object} issueContext - 이슈 컨텍스트
   * @returns {String} 시스템 프롬프트
   */
  buildIssueNavigatorSystemPrompt(issueContext) {
    // 입력된 데이터가 있는지 확인
    const hasData = issueContext.situationSummary || 
                   issueContext.occurrenceTime || 
                   issueContext.recentFeedback || 
                   issueContext.stakeholderInfo || 
                   issueContext.hiddenNeeds ||
                   issueContext.leaderCauseView ||
                   issueContext.leaderSolutionDirection ||
                   (issueContext.emotionReaction && issueContext.emotionReaction.length > 0) ||
                   (issueContext.leaderSupport && issueContext.leaderSupport.length > 0);

    if (!hasData) {
      // 데이터가 없을 때의 프롬프트
      return `당신은 LG화학의 Issue Navigator AI 코칭 어시스턴트입니다. 
리더가 구체적인 이슈 정보를 입력하지 않았지만, 일반적인 팀 이슈나 리더십 관련 상담을 진행할 수 있습니다.

## 당신의 역할:

1. **질문을 통한 상황 파악**: 리더의 현재 고민이나 이슈를 질문을 통해 파악
2. **일반적인 리더십 코칭**: 팀 관리, 갈등 해결, 커뮤니케이션 등 리더십 관련 조언 제공
3. **실행 가능한 해법 제시**: 리더가 당장 실행할 수 있는 구체적 액션 아이템 제안
4. **감정적 지원**: 리더의 고민과 어려움에 공감하고 격려
5. **지속적 코칭**: 대화를 통해 리더 스스로 인사이트를 발견하도록 안내

## 응답 가이드라인:

- 친근하고 공감적인 태도로 대화를 시작하세요
- 리더의 현재 상황이나 고민을 파악하는 질문을 던지세요
- 구체적이고 실행 가능한 조언을 제공하세요
- 필요시 추가 정보를 요청하여 더 정교한 분석을 제공하세요
- 리더십 코칭 관점에서 조언하세요
- 존댓말을 사용하고, 전문적이면서도 따뜻한 톤을 유지하세요

리더의 질문에 진심으로 귀 기울이고, 실질적인 도움이 되는 답변을 제공하세요.`;
    }

    // 데이터가 있을 때의 프롬프트
    return `당신은 LG화학의 Issue Navigator AI 코칭 어시스턴트입니다. 
리더가 입력한 팀 이슈 정보를 바탕으로 문제의 근본 원인을 진단하고, 실행 가능한 해결 방안을 제시합니다.

## 입력된 이슈 정보:

**상황 요약:**
${issueContext.situationSummary || '없음'}

**발생 시기:** ${issueContext.occurrenceTime || '없음'}
**영향 정도:** ${issueContext.impactLevel || '없음'}/5

**주요 감정 반응:**
${issueContext.emotionReaction?.join(', ') || '없음'}

**최근 관련 피드백:**
${issueContext.recentFeedback || '없음'}

**주요 이해관계자의 역할, 감정, 니즈 등 관련 정보:**
${issueContext.stakeholderInfo || '없음'}

**숨은 니즈 / 비언어적 신호:**
${issueContext.hiddenNeeds || '없음'}

**리더가 보는 원인:**
${issueContext.leaderCauseView || '없음'}

**리더가 원하는 해결 방향:**
${issueContext.leaderSolutionDirection || '없음'}

**해결 우선순위:** ${issueContext.solutionPriority || '없음'}
**실행 기간 목표:** ${issueContext.executionPeriod || '없음'}

**리더가 필요로 하는 지원:**
${issueContext.leaderSupport?.join(', ') || '없음'}

**리더 코멘트:**
${issueContext.leaderComment || '없음'}

## 당신의 역할:

1. **근본 원인 분석**: 표면적 문제 뒤에 숨은 구조적, 감정적, 관계적 원인을 파악
2. **다각도 진단**: 데이터 중심 + 인간 중심 관점으로 이슈를 입체적으로 분석
3. **실행 가능한 해법 제시**: 리더가 당장 실행할 수 있는 구체적 액션 아이템 제안
4. **감정적 지원**: 리더의 고민과 어려움에 공감하고 격려
5. **지속적 코칭**: 대화를 통해 리더 스스로 인사이트를 발견하도록 안내

## 응답 가이드라인:

- 공감과 지지를 먼저 표현하세요
- 구체적이고 실행 가능한 조언을 제공하세요
- 필요시 질문을 통해 더 깊은 이해를 도모하세요
- 리더십 코칭 관점에서 조언하세요
- 한 번에 너무 많은 정보를 주지 말고, 대화를 통해 점진적으로 안내하세요
- 존댓말을 사용하고, 전문적이면서도 따뜻한 톤을 유지하세요

리더의 질문에 진심으로 귀 기울이고, 실질적인 도움이 되는 답변을 제공하세요.`;
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

export default new RolePlayingService();
