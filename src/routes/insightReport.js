import express from 'express';
import insightReportService from '../services/insightReportService.js';
import { validateInsightReportRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * 팀원 인사이트 리포트 생성
 * POST /api/insight-report/generate
 */
router.post('/generate', validateInsightReportRequest, async (req, res) => {
  try {
    console.log('📊 인사이트 리포트 생성 요청 시작');
    console.log('👤 팀원 이름:', req.body.teamMember?.name);
    console.log('📋 요청 데이터 구조:', JSON.stringify(req.body, null, 2));
    
    const { 
      teamMember, 
      analysisPeriod,
      analysisTargetData,
      leaderAnalysisPurpose,
      additionalMemo 
    } = req.body;
    
    console.log('🔍 추출된 데이터:');
    console.log('  - 팀원:', teamMember);
    console.log('  - 분석 기간:', analysisPeriod);
    console.log('  - 분석 대상 데이터:', analysisTargetData);
    console.log('  - 리더 분석 목적:', leaderAnalysisPurpose);
    console.log('  - 추가 메모:', additionalMemo);
    
    // 새로운 데이터 구조에 맞게 서비스 호출
    console.log('🚀 서비스 호출 시작');
    const report = await insightReportService.generateInsightReport({
      teamMember,
      analysisPeriod,
      analysisTargetData,
      leaderAnalysisPurpose,
      additionalMemo
    });
    
    console.log('✅ 인사이트 리포트 생성 완료:', report.id);
    
    res.json({
      success: true,
      data: report,
      message: '인사이트 리포트가 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ 인사이트 리포트 생성 실패:', error);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || '인사이트 리포트 생성 중 오류가 발생했습니다'
    });
  }
});

/**
 * 감정 분석만 수행
 * POST /api/insight-report/analyze-emotions
 */
router.post('/analyze-emotions', async (req, res) => {
  try {
    const { textData } = req.body;
    
    if (!textData) {
      return res.status(400).json({
        success: false,
        error: '분석할 텍스트 데이터가 필요합니다'
      });
    }

    const emotionAnalysis = await insightReportService.analyzeEmotions([{ content: textData }]);
    
    res.json({
      success: true,
      data: emotionAnalysis,
      message: '감정 분석이 완료되었습니다'
    });
  } catch (error) {
    console.error('❌ 감정 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '감정 분석 중 오류가 발생했습니다'
    });
  }
});

/**
 * 스트레스/몰입 분석만 수행
 * POST /api/insight-report/analyze-stress-engagement
 */
router.post('/analyze-stress-engagement', async (req, res) => {
  try {
    const { teamMember, feedbackData } = req.body;
    
    if (!teamMember) {
      return res.status(400).json({
        success: false,
        error: '팀원 정보가 필요합니다'
      });
    }

    const analysis = await insightReportService.analyzeStressAndEngagement(feedbackData || [], teamMember);
    
    res.json({
      success: true,
      data: analysis,
      message: '스트레스/몰입 분석이 완료되었습니다'
    });
  } catch (error) {
    console.error('❌ 스트레스/몰입 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '스트레스/몰입 분석 중 오류가 발생했습니다'
    });
  }
});

/**
 * 리포트 템플릿 조회
 * GET /api/insight-report/templates
 */
router.get('/templates', (req, res) => {
  const templates = {
    reportTemplate: {
      title: "[팀원명] 종합 인사이트 리포트",
      sections: [
        {
          name: "현재 상태 요약",
          fields: ["전반적 컨디션", "에너지 레벨", "집중 영역"]
        },
        {
          name: "감정 트렌드 (최근 30일)",
          fields: ["긍정", "중립", "부정", "변화율"]
        },
        {
          name: "핵심 발견사항",
          subsections: ["강점", "개선 기회"]
        },
        {
          name: "지원 방안",
          subsections: ["즉시 실행 가능한 지원", "중기적 개발 기회", "장기적 성장 방향"]
        }
      ]
    },
    emotionCategories: [
      "만족", "동기부여", "스트레스", "피로", "성취감", "불안", "자신감", "좌절"
    ],
    stressFactors: [
      "업무 과부하", "역할 모호성", "자원 부족", "대인관계 갈등", "시간 압박", "성과 압박"
    ],
    engagementFactors: [
      "자율성", "숙련도 기회", "목표 명확성", "의미 인식", "성장 가능성", "인정과 보상"
    ]
  };

  res.json({
    success: true,
    data: templates
  });
});

/**
 * 리포트 히스토리 조회
 * GET /api/insight-report/history
 */
router.get('/history', (req, res) => {
  // 실제 구현에서는 데이터베이스에서 조회
  const mockHistory = [
    {
      id: '1',
      teamMember: '김철수',
      generatedAt: '2024-01-15 16:45:00',
      overallCondition: '좋음',
      energyLevel: '높음',
      keyInsights: ['긍정적 감정 비율: 75%', '주요 강점: 협업 능력']
    },
    {
      id: '2',
      teamMember: '이영희', 
      generatedAt: '2024-01-14 11:20:00',
      overallCondition: '보통',
      energyLevel: '중간',
      keyInsights: ['긍정적 감정 비율: 60%', '개선 필요: 시간 관리']
    }
  ];

  res.json({
    success: true,
    data: mockHistory
  });
});

/**
 * 팀 전체 인사이트 요약
 * GET /api/insight-report/team-summary
 */
router.get('/team-summary', (req, res) => {
  // 실제 구현에서는 팀 전체 데이터를 집계
  const teamSummary = {
    totalMembers: 8,
    averageCondition: '좋음',
    averageEnergyLevel: '중간',
    commonStrengths: ['협업 능력', '문제 해결', '학습 의지'],
    commonImprovementAreas: ['시간 관리', '의사소통', '스트레스 관리'],
    teamTrends: {
      overallSatisfaction: 78,
      stressLevel: 45,
      engagementLevel: 72,
      productivity: 85
    },
    recommendations: [
      '팀 전체 시간 관리 워크샵 진행',
      '스트레스 관리 프로그램 도입',
      '성과 인정 문화 강화'
    ]
  };

  res.json({
    success: true,
    data: teamSummary
  });
});

export default router;
