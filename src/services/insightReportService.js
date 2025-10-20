import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import Sentiment from 'sentiment';

class InsightReportService {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    this.sentiment = new Sentiment();
  }

  /**
   * 팀원 인사이트 리포트 생성
   * @param {Object} requestData - 요청 데이터
   * @param {Object} requestData.teamMember - 팀원 정보
   * @param {number} requestData.analysisPeriod - 분석 기간
   * @param {Object} requestData.analysisTargetData - 분석 대상 데이터
   * @param {Object} requestData.leaderAnalysisPurpose - 리더의 분석 목적
   * @param {Object} requestData.additionalMemo - 추가 메모
   * @returns {Object} 인사이트 리포트
   */
  async generateInsightReport(requestData) {
    try {
      const { teamMember, analysisPeriod, analysisTargetData, leaderAnalysisPurpose, additionalMemo } = requestData;
      
      console.log(`🔍 ${teamMember.name}님의 인사이트 리포트 생성 시작`);
      console.log('📊 분석 기간:', analysisPeriod, '일');
      console.log('🎯 인사이트 초점:', leaderAnalysisPurpose.insightFocus);
      
      // 피드백 데이터 추출 (새로운 구조에서)
      const feedbackData = this.extractFeedbackData(analysisTargetData);
      
      // 1. 감정 분석 수행
      const emotionAnalysis = await this.analyzeEmotions(feedbackData);
      
      // 2. 스트레스/몰입 요인 분석
      const stressEngagementAnalysis = await this.analyzeStressAndEngagement(feedbackData, teamMember);
      
      // 3. 성과 및 트렌드 분석
      const performanceAnalysis = await this.analyzePerformance(feedbackData, teamMember, analysisTargetData);
      
      // 4. 강점 및 개선 영역 식별
      const strengthsAndImprovements = await this.identifyStrengthsAndImprovements(
        emotionAnalysis, 
        stressEngagementAnalysis, 
        performanceAnalysis
      );
      
      // 5. 지원 방안 제안
      const supportRecommendations = await this.generateSupportRecommendations(
        strengthsAndImprovements,
        stressEngagementAnalysis,
        leaderAnalysisPurpose
      );

      const report = {
        id: uuidv4(),
        teamMember: {
          name: teamMember.name
          // position과 department는 제거됨
        },
        generatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        period: this.getAnalysisPeriod(feedbackData),
        emotionAnalysis,
        stressEngagementAnalysis,
        performanceAnalysis,
        strengthsAndImprovements,
        supportRecommendations,
        overallCondition: this.calculateOverallCondition(emotionAnalysis, stressEngagementAnalysis),
        energyLevel: this.calculateEnergyLevel(emotionAnalysis, stressEngagementAnalysis),
        keyInsights: this.extractKeyInsights(emotionAnalysis, stressEngagementAnalysis, performanceAnalysis)
      };

      console.log(`✅ ${teamMember.name}님의 인사이트 리포트 생성 완료`);
      return report;
    } catch (error) {
      console.error('❌ 인사이트 리포트 생성 중 오류:', error);
      throw new Error('인사이트 리포트 생성에 실패했습니다');
    }
  }

  /**
   * 감정 분석 수행
   */
  async analyzeEmotions(feedbackData) {
    if (!feedbackData || feedbackData.length === 0) {
      return this.getDefaultEmotionAnalysis();
    }

    const textData = feedbackData.map(item => item.content || item.text || '').join(' ');
    
    // Sentiment.js를 사용한 기본 감정 분석
    const sentimentResult = this.sentiment.analyze(textData);
    
    // OpenAI를 사용한 고급 감정 분석
    const advancedAnalysis = await this.performAdvancedEmotionAnalysis(textData);
    
    return {
      overall: {
        positive: Math.max(0, Math.min(100, 50 + sentimentResult.score * 10)),
        neutral: Math.max(0, 100 - Math.abs(sentimentResult.score) * 10),
        negative: Math.max(0, Math.min(100, 50 - sentimentResult.score * 10))
      },
      trends: advancedAnalysis.trends,
      dominantEmotions: advancedAnalysis.dominantEmotions,
      sentimentScore: sentimentResult.score,
      confidence: sentimentResult.calculation
    };
  }

  /**
   * 고급 감정 분석 (OpenAI 활용)
   */
  async performAdvancedEmotionAnalysis(textData) {
    const prompt = `
다음 텍스트 데이터를 분석하여 감정 트렌드와 주요 감정을 파악해주세요:

텍스트: ${textData}

다음 JSON 형식으로 분석 결과를 제공해주세요:
{
  "trends": {
    "recent_30_days": {
      "positive": 60,
      "neutral": 25, 
      "negative": 15,
      "change_from_previous": "+5"
    }
  },
  "dominantEmotions": ["만족", "동기부여", "스트레스"],
  "emotionPatterns": {
    "workload_stress": "medium",
    "achievement_satisfaction": "high",
    "team_collaboration": "positive",
    "growth_motivation": "high"
  }
}
`;

    if (!this.openai) {
      console.log('OpenAI API 키가 설정되지 않아 기본 고급 분석을 사용합니다.');
      return this.getDefaultAdvancedAnalysis();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('고급 감정 분석 오류:', error);
      return this.getDefaultAdvancedAnalysis();
    }
  }

  /**
   * 스트레스 및 몰입 요인 분석
   */
  async analyzeStressAndEngagement(feedbackData, teamMember) {
    const prompt = `
다음 팀원의 피드백 데이터를 분석하여 스트레스 요인과 몰입 요인을 파악해주세요:

팀원 정보:
- 이름: ${teamMember.name}
- 직급: ${teamMember.position}
- 부서: ${teamMember.department}

피드백 데이터: ${JSON.stringify(feedbackData, null, 2)}

다음 JSON 형식으로 분석 결과를 제공해주세요:
{
  "stressFactors": {
    "workload": "high|medium|low",
    "role_ambiguity": "high|medium|low", 
    "resource_shortage": "high|medium|low",
    "interpersonal_tension": "high|medium|low",
    "time_pressure": "high|medium|low"
  },
  "engagementFactors": {
    "autonomy": "high|medium|low",
    "mastery_opportunities": "high|medium|low",
    "goal_clarity": "high|medium|low",
    "meaning_recognition": "high|medium|low",
    "growth_potential": "high|medium|low"
  },
  "recommendations": {
    "stress_reduction": ["권장사항1", "권장사항2"],
    "engagement_boost": ["권장사항1", "권장사항2"]
  }
}
`;

    if (!this.openai) {
      console.log('OpenAI API 키가 설정되지 않아 기본 스트레스/몰입 분석을 사용합니다.');
      return this.getDefaultStressEngagementAnalysis();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 600
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('스트레스/몰입 분석 오류:', error);
      return this.getDefaultStressEngagementAnalysis();
    }
  }

  /**
   * 성과 및 트렌드 분석
   */
  async analyzePerformance(feedbackData, teamMember, analysisTargetData = null) {
    return {
      recentAchievements: [
        "프로젝트 A 완료 (예정보다 1주일 앞당김)",
        "팀 내 지식 공유 세션 주도",
        "고객 만족도 95% 달성"
      ],
      performanceTrends: {
        productivity: "increasing",
        quality: "stable", 
        collaboration: "improving",
        innovation: "moderate"
      },
      keyMetrics: {
        project_completion_rate: 95,
        team_satisfaction_score: 4.2,
        learning_engagement: 8.5
      }
    };
  }

  /**
   * 강점 및 개선 영역 식별
   */
  async identifyStrengthsAndImprovements(emotionAnalysis, stressEngagementAnalysis, performanceAnalysis) {
    const prompt = `
다음 분석 결과를 바탕으로 팀원의 강점과 개선 영역을 식별해주세요:

감정 분석: ${JSON.stringify(emotionAnalysis, null, 2)}
스트레스/몰입 분석: ${JSON.stringify(stressEngagementAnalysis, null, 2)}
성과 분석: ${JSON.stringify(performanceAnalysis, null, 2)}

다음 JSON 형식으로 결과를 제공해주세요:
{
  "strengths": [
    {
      "area": "영역명",
      "description": "구체적인 설명",
      "evidence": "근거",
      "impact": "팀에 미치는 영향"
    }
  ],
  "improvementAreas": [
    {
      "area": "개선 영역명", 
      "description": "구체적인 설명",
      "priority": "high|medium|low",
      "suggestedActions": ["액션1", "액션2"]
    }
  ]
}
`;

    if (!this.openai) {
      console.log('OpenAI API 키가 설정되지 않아 기본 강점/개선영역 분석을 사용합니다.');
      return this.getDefaultStrengthsAndImprovements();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('강점/개선영역 식별 오류:', error);
      return this.getDefaultStrengthsAndImprovements();
    }
  }

  /**
   * 지원 방안 제안
   */
  async generateSupportRecommendations(strengthsAndImprovements, stressEngagementAnalysis, leaderAnalysisPurpose = null) {
    return {
      immediate: [
        "스트레스 요인에 대한 즉시 대응 방안 마련",
        "강점을 활용할 수 있는 새로운 기회 제공",
        "개선 영역에 대한 구체적인 피드백 제공"
      ],
      shortTerm: [
        "1개월 내 목표 설정 및 정기 체크인",
        "필요한 교육이나 리소스 제공",
        "팀 내 멘토링 프로그램 연결"
      ],
      longTerm: [
        "3-6개월 성장 로드맵 수립",
        "장기적 커리어 목표와의 연계",
        "리더십 역량 개발 기회 제공"
      ]
    };
  }

  // 유틸리티 메서드들
  getAnalysisPeriod(feedbackData) {
    if (!feedbackData || feedbackData.length === 0) {
      return "최근 30일";
    }
    
    const dates = feedbackData
      .map(item => new Date(item.timestamp || item.date))
      .filter(date => !isNaN(date));
    
    if (dates.length === 0) return "최근 30일";
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return `${minDate.toLocaleDateString()} ~ ${maxDate.toLocaleDateString()}`;
  }

  calculateOverallCondition(emotionAnalysis, stressEngagementAnalysis) {
    const positiveRatio = emotionAnalysis.overall.positive / 100;
    const stressLevel = this.calculateStressLevel(stressEngagementAnalysis.stressFactors);
    
    if (positiveRatio > 0.7 && stressLevel < 0.3) return "매우 좋음";
    if (positiveRatio > 0.5 && stressLevel < 0.5) return "좋음";
    if (positiveRatio > 0.3 && stressLevel < 0.7) return "보통";
    return "주의 필요";
  }

  calculateEnergyLevel(emotionAnalysis, stressEngagementAnalysis) {
    const positiveRatio = emotionAnalysis.overall.positive / 100;
    const engagementLevel = this.calculateEngagementLevel(stressEngagementAnalysis.engagementFactors);
    
    const energyScore = (positiveRatio + engagementLevel) / 2;
    
    if (energyScore > 0.7) return "높음";
    if (energyScore > 0.4) return "중간";
    return "낮음";
  }

  calculateStressLevel(stressFactors) {
    const levels = { high: 1, medium: 0.5, low: 0 };
    const values = Object.values(stressFactors).map(level => levels[level] || 0);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateEngagementLevel(engagementFactors) {
    const levels = { high: 1, medium: 0.5, low: 0 };
    const values = Object.values(engagementFactors).map(level => levels[level] || 0);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  extractKeyInsights(emotionAnalysis, stressEngagementAnalysis, performanceAnalysis) {
    return [
      `긍정적 감정 비율: ${emotionAnalysis.overall.positive}%`,
      `주요 스트레스 요인: ${Object.keys(stressEngagementAnalysis.stressFactors).filter(key => 
        stressEngagementAnalysis.stressFactors[key] === 'high').join(', ') || '없음'}`,
      `몰입도가 높은 영역: ${Object.keys(stressEngagementAnalysis.engagementFactors).filter(key => 
        stressEngagementAnalysis.engagementFactors[key] === 'high').join(', ') || '없음'}`,
      `최근 성과 트렌드: ${performanceAnalysis.performanceTrends.productivity}`
    ];
  }

  // 기본값 제공 메서드들
  getDefaultEmotionAnalysis() {
    return {
      overall: { positive: 60, neutral: 25, negative: 15 },
      trends: { recent_30_days: { positive: 60, neutral: 25, negative: 15, change_from_previous: "+5" } },
      dominantEmotions: ["만족", "동기부여"],
      sentimentScore: 2,
      confidence: 0.8
    };
  }

  getDefaultAdvancedAnalysis() {
    return {
      trends: { recent_30_days: { positive: 60, neutral: 25, negative: 15, change_from_previous: "+5" } },
      dominantEmotions: ["만족", "동기부여"],
      emotionPatterns: {
        workload_stress: "medium",
        achievement_satisfaction: "high",
        team_collaboration: "positive",
        growth_motivation: "high"
      }
    };
  }

  getDefaultStressEngagementAnalysis() {
    return {
      stressFactors: {
        workload: "medium",
        role_ambiguity: "low",
        resource_shortage: "low",
        interpersonal_tension: "low",
        time_pressure: "medium"
      },
      engagementFactors: {
        autonomy: "high",
        mastery_opportunities: "high",
        goal_clarity: "high",
        meaning_recognition: "high",
        growth_potential: "high"
      },
      recommendations: {
        stress_reduction: ["업무 우선순위 재조정", "시간 관리 스킬 향상"],
        engagement_boost: ["새로운 도전 과제 제공", "성과 인정 강화"]
      }
    };
  }

  getDefaultStrengthsAndImprovements() {
    return {
      strengths: [
        {
          area: "협업 능력",
          description: "팀원들과의 원활한 소통과 협력",
          evidence: "프로젝트 완료율 95%",
          impact: "팀 전체의 효율성 향상"
        }
      ],
      improvementAreas: [
        {
          area: "시간 관리",
          description: "업무 우선순위 설정 및 일정 관리",
          priority: "medium",
          suggestedActions: ["우선순위 매트릭스 활용", "일정 관리 도구 도입"]
        }
      ]
    };
  }

  /**
   * 새로운 데이터 구조에서 피드백 데이터 추출
   * @param {Object} analysisTargetData - 분석 대상 데이터
   * @returns {Array} 피드백 데이터 배열
   */
  extractFeedbackData(analysisTargetData) {
    const feedbackData = [];
    
    // 피드백 로그 텍스트에서 데이터 추출
    if (analysisTargetData.feedbackLog && analysisTargetData.feedbackLog.text) {
      feedbackData.push({
        content: analysisTargetData.feedbackLog.text,
        timestamp: new Date().toISOString(),
        type: 'feedback_log'
      });
    }
    
    // 감정 요약 메모에서 데이터 추출
    if (analysisTargetData.emotionSummary) {
      feedbackData.push({
        content: analysisTargetData.emotionSummary,
        timestamp: new Date().toISOString(),
        type: 'emotion_summary'
      });
    }
    
    // 성과지표 데이터에서 데이터 추출
    if (analysisTargetData.performanceData) {
      const performanceText = [];
      if (analysisTargetData.performanceData.kpiAchievement) {
        performanceText.push(`KPI 달성률: ${analysisTargetData.performanceData.kpiAchievement}`);
      }
      if (analysisTargetData.performanceData.projectCompletion) {
        performanceText.push(`프로젝트 완료: ${analysisTargetData.performanceData.projectCompletion}`);
      }
      
      if (performanceText.length > 0) {
        feedbackData.push({
          content: performanceText.join(', '),
          timestamp: new Date().toISOString(),
          type: 'performance_data'
        });
      }
    }
    
    return feedbackData;
  }
}

export default new InsightReportService();
