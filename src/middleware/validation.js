/**
 * 요청 데이터 유효성 검사 미들웨어
 */

/**
 * 미팅 프렙팩 요청 유효성 검사
 */
export const validateMeetingPrepRequest = (req, res, next) => {
  const { teamMember } = req.body;
  
  if (!teamMember) {
    return res.status(400).json({
      success: false,
      error: '팀원 정보가 필요합니다'
    });
  }

  const requiredFields = ['name', 'position'];
  const missingFields = requiredFields.filter(field => !teamMember[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `다음 필드가 필요합니다: ${missingFields.join(', ')}`
    });
  }

  next();
};

/**
 * 인사이트 리포트 요청 유효성 검사
 */
export const validateInsightReportRequest = (req, res, next) => {
  console.log('🔍 인사이트 리포트 요청 유효성 검사 시작');
  console.log('📋 요청 본문 전체:', JSON.stringify(req.body, null, 2));
  console.log('📋 요청 헤더:', req.headers);
  
  const { teamMember, leaderAnalysisPurpose } = req.body;
  
  console.log('👤 팀원 정보:', teamMember);
  console.log('🎯 리더 분석 목적:', leaderAnalysisPurpose);
  
  if (!teamMember) {
    console.log('❌ 팀원 정보가 없음');
    return res.status(400).json({
      success: false,
      error: '팀원 정보가 필요합니다'
    });
  }

  // 필수 필드: name만 필요 (position, department는 제거됨)
  const requiredFields = ['name'];
  const missingFields = requiredFields.filter(field => !teamMember[field]);
  
  console.log('📝 필수 필드 검사:', { requiredFields, missingFields });
  
  if (missingFields.length > 0) {
    console.log('❌ 필수 필드 누락:', missingFields);
    return res.status(400).json({
      success: false,
      error: `다음 필드가 필요합니다: ${missingFields.join(', ')}`
    });
  }

  // 인사이트 초점이 필수인지 확인
  if (!leaderAnalysisPurpose || !leaderAnalysisPurpose.insightFocus) {
    console.log('❌ 인사이트 초점이 없음:', leaderAnalysisPurpose);
    return res.status(400).json({
      success: false,
      error: '인사이트 초점을 선택해주세요'
    });
  }

  console.log('✅ 인사이트 리포트 요청 유효성 검사 통과');
  next();
};

/**
 * 롤플레잉 요청 유효성 검사
 */
export const validateRolePlayingRequest = (req, res, next) => {
  const { teamMemberProfile, scenario, coachingGoals } = req.body;
  
  if (!teamMemberProfile) {
    return res.status(400).json({
      success: false,
      error: '팀원 프로필이 필요합니다'
    });
  }

  const requiredFields = ['name', 'position', 'department'];
  const missingFields = requiredFields.filter(field => !teamMemberProfile[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `다음 필드가 필요합니다: ${missingFields.join(', ')}`
    });
  }

  if (!scenario) {
    return res.status(400).json({
      success: false,
      error: '시나리오가 필요합니다'
    });
  }

  if (!coachingGoals || !Array.isArray(coachingGoals) || coachingGoals.length === 0) {
    return res.status(400).json({
      success: false,
      error: '코칭 목표가 필요합니다'
    });
  }

  next();
};

/**
 * 일반적인 요청 유효성 검사
 */
export const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `다음 필드가 필요합니다: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};
