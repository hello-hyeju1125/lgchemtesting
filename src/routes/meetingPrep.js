import express from 'express';
import meetingPrepService from '../services/meetingPrepService.js';
import { validateMeetingPrepRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * 1:1 미팅 프렙팩 생성
 * POST /api/meeting-prep/generate
 */
router.post('/generate', validateMeetingPrepRequest, async (req, res) => {
  try {
    console.log('🎯 미팅 프렙팩 생성 요청:', req.body.teamMember.name);
    console.log('📊 팀원 성향:', req.body.teamMember.tendencies);
    console.log('🎯 리더 의도:', req.body.meetingInfo?.leaderIntention);
    console.log('⏰ 미팅 일시:', req.body.meetingInfo?.meetingDateTime);
    
    const meetingPrep = await meetingPrepService.generateMeetingPrep(req.body.teamMember, req.body.meetingInfo);
    
    console.log('✅ 미팅 프렙팩 생성 완료:', meetingPrep.id);
    
    res.json({
      success: true,
      data: meetingPrep,
      message: '미팅 프렙팩이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ 미팅 프렙팩 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '미팅 프렙팩 생성 중 오류가 발생했습니다'
    });
  }
});

/**
 * 미팅 프렙팩 템플릿 조회
 * GET /api/meeting-prep/templates
 */
router.get('/templates', (req, res) => {
  const templates = {
    questionTemplates: {
      situationAwareness: [
        "최근 진행 중인 프로젝트에서 가장 중요하게 생각하는 부분은 무엇인가요?",
        "이번 주 업무에서 가장 큰 성취감을 느낀 순간은 언제였나요?",
        "현재 업무에서 가장 도전적인 부분은 무엇인가요?",
        "최근 팀 내에서 일어난 변화 중 주목할 만한 것은 무엇인가요?"
      ],
      growthSupport: [
        "현재 역량 개발에서 집중하고 싶은 영역이 있나요?",
        "업무 수행 중 가장 도움이 필요한 부분은 무엇인가요?",
        "6개월 후 어떤 모습이 되고 싶으신가요?",
        "어떤 새로운 스킬이나 지식을 배우고 싶으신가요?",
        "현재 업무에서 더 발전시키고 싶은 부분은 무엇인가요?"
      ],
      motivation: [
        "팀에서 가치 있다고 느끼는 활동은 무엇인가요?",
        "어떤 상황에서 가장 많은 에너지를 얻나요?",
        "업무에서 가장 만족스러운 순간은 언제인가요?",
        "팀의 목표 달성에 기여하고 있다고 느끼는 부분은 무엇인가요?"
      ]
    },
    encouragementTemplates: [
      "~~님의 [구체적인 행동]이 팀에 큰 영향을 주고 있어요. 특히 [구체적인 결과]에서 그 가치가 잘 드러납니다.",
      "최근 [상황]에서 보여준 [역량/태도]이 정말 인상적이었습니다. 이런 접근이 ~~님의 성장뿐만 아니라 팀 전체에도 긍정적인 영향을 줍니다.",
      "~~님이 가진 [강점]은 우리 팀에게 매우 소중한 자산이에요. 이를 더욱 발전시킬 수 있는 기회를 찾아보겠습니다.",
      "꾸준한 노력과 긍정적인 태도가 팀 전체의 분위기를 밝게 만들어주고 있습니다.",
      "최근 보여주신 [구체적인 성과]는 정말 훌륭합니다. 이런 성장세를 유지하시면 더 큰 성과를 거두실 수 있을 것 같아요."
    ],
    meetingGuidelines: {
      opening: [
        "따뜻한 인사와 최근 근황 물어보기",
        "이번 미팅의 목적과 기대효과 공유",
        "편안한 분위기 조성",
        "팀원의 현재 상태와 관심사 파악"
      ],
      during: [
        "적극적인 경청과 공감 표현",
        "구체적인 예시를 통한 피드백",
        "성장 지향적 질문 활용",
        "팀원의 의견을 존중하고 격려",
        "명확하고 건설적인 피드백 제공"
      ],
      closing: [
        "다음 단계와 후속 조치 명확히 하기",
        "지속적인 지원 의지 표현",
        "다음 미팅 일정 조율",
        "미팅 내용 요약 및 확인"
      ]
    }
  };

  res.json({
    success: true,
    data: templates
  });
});

/**
 * 미팅 프렙팩 히스토리 조회 (간단한 메모리 기반)
 * GET /api/meeting-prep/history
 */
router.get('/history', (req, res) => {
  // 실제 구현에서는 데이터베이스에서 조회
  const mockHistory = [
    {
      id: '1',
      teamMember: '김철수',
      generatedAt: '2024-01-15 14:30:00',
      status: 'completed'
    },
    {
      id: '2', 
      teamMember: '이영희',
      generatedAt: '2024-01-14 10:15:00',
      status: 'in_progress'
    }
  ];

  res.json({
    success: true,
    data: mockHistory
  });
});

export default router;
